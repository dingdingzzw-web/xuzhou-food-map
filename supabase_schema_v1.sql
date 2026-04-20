-- 徐州美食地图 MVP 数据库设计 v1
-- 适用于 Supabase Postgres
-- 范围：shops / shop_images / shop_votes

begin;

-- 可选扩展，生成 uuid 时使用
create extension if not exists pgcrypto;

-- =========================
-- 1. 店铺主表
-- =========================
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  cover_image_url text,
  reason text not null,
  creator_name text not null,
  alias text,
  good_count integer not null default 0,
  bad_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shops_name_not_blank check (length(btrim(name)) > 0),
  constraint shops_address_not_blank check (length(btrim(address)) > 0),
  constraint shops_reason_not_blank check (length(btrim(reason)) > 0),
  constraint shops_creator_name_not_blank check (length(btrim(creator_name)) > 0),
  constraint shops_lat_range check (lat >= -90 and lat <= 90),
  constraint shops_lng_range check (lng >= -180 and lng <= 180),
  constraint shops_good_count_nonnegative check (good_count >= 0),
  constraint shops_bad_count_nonnegative check (bad_count >= 0)
);

create index if not exists idx_shops_created_at on public.shops (created_at desc);
create index if not exists idx_shops_name on public.shops (name);
create index if not exists idx_shops_lat_lng on public.shops (lat, lng);

comment on table public.shops is '店铺主表';
comment on column public.shops.cover_image_url is '店铺封面图';
comment on column public.shops.reason is '推荐理由';
comment on column public.shops.creator_name is '上传者昵称';
comment on column public.shops.alias is '店铺别名 / 民间叫法';
comment on column public.shops.good_count is '好次数';
comment on column public.shops.bad_count is '包次数';

-- =========================
-- 2. 店铺图片表
-- =========================
create table if not exists public.shop_images (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  image_url text not null,
  uploader_name text not null,
  created_at timestamptz not null default now(),

  constraint shop_images_image_url_not_blank check (length(btrim(image_url)) > 0),
  constraint shop_images_uploader_name_not_blank check (length(btrim(uploader_name)) > 0)
);

create index if not exists idx_shop_images_shop_id on public.shop_images (shop_id);
create index if not exists idx_shop_images_created_at on public.shop_images (created_at desc);

comment on table public.shop_images is '店铺图片表';
comment on column public.shop_images.uploader_name is '补图者昵称';

-- =========================
-- 3. 店铺投票表
-- =========================
create table if not exists public.shop_votes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  voter_key text not null,
  vote_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shop_votes_voter_key_not_blank check (length(btrim(voter_key)) > 0),
  constraint shop_votes_vote_type_valid check (vote_type in ('good', 'bad')),
  constraint shop_votes_shop_voter_unique unique (shop_id, voter_key)
);

create index if not exists idx_shop_votes_shop_id on public.shop_votes (shop_id);
create index if not exists idx_shop_votes_vote_type on public.shop_votes (vote_type);
create index if not exists idx_shop_votes_voter_key on public.shop_votes (voter_key);

comment on table public.shop_votes is '店铺投票表';
comment on column public.shop_votes.voter_key is '投票去重标识，MVP 可用匿名设备标识';
comment on column public.shop_votes.vote_type is 'good=好次, bad=包次';

-- =========================
-- 4. 自动更新时间函数
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- shops.updated_at

drop trigger if exists trg_shops_set_updated_at on public.shops;
create trigger trg_shops_set_updated_at
before update on public.shops
for each row
execute function public.set_updated_at();

-- shop_votes.updated_at

drop trigger if exists trg_shop_votes_set_updated_at on public.shop_votes;
create trigger trg_shop_votes_set_updated_at
before update on public.shop_votes
for each row
execute function public.set_updated_at();

-- =========================
-- 5. 投票计数刷新函数
-- =========================
create or replace function public.refresh_shop_vote_counts(p_shop_id uuid)
returns void
language plpgsql
as $$
begin
  update public.shops s
  set
    good_count = (
      select count(*)
      from public.shop_votes v
      where v.shop_id = p_shop_id and v.vote_type = 'good'
    ),
    bad_count = (
      select count(*)
      from public.shop_votes v
      where v.shop_id = p_shop_id and v.vote_type = 'bad'
    )
  where s.id = p_shop_id;
end;
$$;

-- =========================
-- 6. 投票后自动刷新聚合计数
-- =========================
create or replace function public.handle_shop_votes_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_shop_vote_counts(old.shop_id);
    return old;
  end if;

  perform public.refresh_shop_vote_counts(new.shop_id);

  if tg_op = 'UPDATE' and old.shop_id <> new.shop_id then
    perform public.refresh_shop_vote_counts(old.shop_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_shop_votes_after_change on public.shop_votes;
create trigger trg_shop_votes_after_change
after insert or update or delete on public.shop_votes
for each row
execute function public.handle_shop_votes_change();

commit;

-- =========================
-- 7. 使用建议
-- =========================
-- 1) 新建店铺时，前端先写入 shops，再按需插入首图到 shop_images
--    这样能避免 after insert trigger 与 RLS 策略相互影响
-- 2) 用户补图时，插入 shop_images
-- 3) 用户投票时：
--    - 未投票：insert shop_votes
--    - 已投同类：前端提示已投过
--    - 已投相反：update shop_votes set vote_type = 'good'/'bad'
-- 4) shops.good_count / bad_count 由触发器自动维护
