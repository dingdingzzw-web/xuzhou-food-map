-- 徐州美食地图 MVP RLS + Storage 规则 v1
-- 适用于 Supabase
-- 假设使用 Supabase Auth 匿名登录或轻登录
-- 如果暂时不用 auth，也可以先关闭 RLS 做本地开发，后续再启用本文件

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

-- =========================
-- 2. shops policies
-- =========================
-- 所有人可读店铺
create policy if not exists "shops_select_all"
on public.shops
for select
using (true);

-- 登录用户可创建店铺
create policy if not exists "shops_insert_authenticated"
on public.shops
for insert
to authenticated
with check (
  length(btrim(name)) > 0
  and length(btrim(address)) > 0
  and length(btrim(reason)) > 0
  and length(btrim(creator_name)) > 0
);

-- MVP 阶段不开放前端直接更新店铺主体信息
-- 后续如需支持上传者修改，再补 update policy

-- =========================
-- 3. shop_images policies
-- =========================
-- 所有人可读图片
create policy if not exists "shop_images_select_all"
on public.shop_images
for select
using (true);

-- 登录用户可补图
create policy if not exists "shop_images_insert_authenticated"
on public.shop_images
for insert
to authenticated
with check (
  shop_id is not null
  and length(btrim(image_url)) > 0
  and length(btrim(uploader_name)) > 0
);

-- MVP 阶段不开放前端删除图片

-- =========================
-- 4. shop_votes policies
-- =========================
-- 所有人可读投票结果
create policy if not exists "shop_votes_select_all"
on public.shop_votes
for select
using (true);

-- 登录用户可投票
create policy if not exists "shop_votes_insert_authenticated"
on public.shop_votes
for insert
to authenticated
with check (
  shop_id is not null
  and length(btrim(voter_key)) > 0
  and vote_type in ('good', 'bad')
);

-- 登录用户可改自己的票
-- 这里要求 voter_key 与 auth.uid() 绑定使用，推荐前端直接把 auth.uid() 作为 voter_key
create policy if not exists "shop_votes_update_own"
on public.shop_votes
for update
to authenticated
using (voter_key = auth.uid()::text)
with check (
  voter_key = auth.uid()::text
  and vote_type in ('good', 'bad')
);

-- 不开放 delete，避免前端随意清票

-- =========================
-- 5. Storage policies for shop-images
-- =========================
-- 公开读
create policy if not exists "shop_images_bucket_public_read"
on storage.objects
for select
using (bucket_id = 'shop-images');

-- 登录用户可上传图片到 shop-images bucket
create policy if not exists "shop_images_bucket_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-images'
);

-- 登录用户可更新自己上传的对象
create policy if not exists "shop_images_bucket_update_own"
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

-- 登录用户可删除自己上传的对象
create policy if not exists "shop_images_bucket_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shop-images'
  and owner = auth.uid()
);

commit;

-- =========================
-- 6. 实施建议
-- =========================
-- 推荐 MVP 直接这样用：
-- 1) 前端先调用 supabase.auth.signInAnonymously()
-- 2) 投票时把 auth.uid() 作为 voter_key
-- 3) 上传图片到 bucket: shop-images
-- 4) 取到公开 URL 后写入 shops.cover_image_url 或 shop_images.image_url
--
-- 这样可以同时满足：
-- - 不强制用户注册
-- - 基本具备去重能力
-- - 能启用 RLS，不至于完全裸奔
