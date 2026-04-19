-- 徐州美食地图 MVP RLS + Storage 规则 v2
-- 兼容当前 Supabase/Postgres 环境，避免使用 create policy if not exists

begin;

-- =========================
-- 0. Storage bucket
-- =========================
insert into storage.buckets (id, name, public)
values ('shop-images', 'shop-images', true)
on conflict (id) do nothing;

comment on table public.shops is '店铺主表';

-- =========================
-- 1. 开启 RLS
-- =========================
alter table public.shops enable row level security;
alter table public.shop_images enable row level security;
alter table public.shop_votes enable row level security;
alter table storage.objects enable row level security;

-- =========================
-- 2. 清理旧 policy（幂等）
-- =========================
drop policy if exists "shops_select_all" on public.shops;
drop policy if exists "shops_insert_authenticated" on public.shops;

drop policy if exists "shop_images_select_all" on public.shop_images;
drop policy if exists "shop_images_insert_authenticated" on public.shop_images;

drop policy if exists "shop_votes_select_all" on public.shop_votes;
drop policy if exists "shop_votes_insert_authenticated" on public.shop_votes;
drop policy if exists "shop_votes_update_own" on public.shop_votes;

drop policy if exists "shop_images_bucket_public_read" on storage.objects;
drop policy if exists "shop_images_bucket_insert_authenticated" on storage.objects;
drop policy if exists "shop_images_bucket_update_own" on storage.objects;
drop policy if exists "shop_images_bucket_delete_own" on storage.objects;

-- =========================
-- 3. shops policies
-- =========================
create policy "shops_select_all"
on public.shops
for select
using (true);

create policy "shops_insert_authenticated"
on public.shops
for insert
to authenticated
with check (
  length(btrim(name)) > 0
  and length(btrim(address)) > 0
  and length(btrim(reason)) > 0
  and length(btrim(creator_name)) > 0
);

-- =========================
-- 4. shop_images policies
-- =========================
create policy "shop_images_select_all"
on public.shop_images
for select
using (true);

create policy "shop_images_insert_authenticated"
on public.shop_images
for insert
to authenticated
with check (
  shop_id is not null
  and length(btrim(image_url)) > 0
  and length(btrim(uploader_name)) > 0
);

-- =========================
-- 5. shop_votes policies
-- =========================
create policy "shop_votes_select_all"
on public.shop_votes
for select
using (true);

create policy "shop_votes_insert_authenticated"
on public.shop_votes
for insert
to authenticated
with check (
  shop_id is not null
  and length(btrim(voter_key)) > 0
  and vote_type in ('good', 'bad')
);

create policy "shop_votes_update_own"
on public.shop_votes
for update
to authenticated
using (voter_key = auth.uid()::text)
with check (
  voter_key = auth.uid()::text
  and vote_type in ('good', 'bad')
);

-- =========================
-- 6. Storage policies for shop-images
-- =========================
create policy "shop_images_bucket_public_read"
on storage.objects
for select
using (bucket_id = 'shop-images');

create policy "shop_images_bucket_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-images'
);

create policy "shop_images_bucket_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shop-images'
  and owner = auth.uid()
)
with check (
  bucket_id = 'shop-images'
  and owner = auth.uid()
);

create policy "shop_images_bucket_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shop-images'
  and owner = auth.uid()
);

commit;
