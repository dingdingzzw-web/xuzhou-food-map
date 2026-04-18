# Supabase SQL 说明 v1

文件位置：`supabase_schema_v1.sql`

## 这版做了什么

当前 SQL 只覆盖 MVP 需要的 3 张表：
- `shops`
- `shop_images`
- `shop_votes`

并且额外做了 3 件实用的事：
- 自动维护 `updated_at`
- 自动同步店铺首图到 `shop_images`
- 自动维护 `shops.good_count` / `shops.bad_count`

---

## 表说明

## 1. shops
店铺主表。

存：
- 店名
- 地址
- 经纬度
- 封面图
- 推荐理由
- 上传者昵称
- 好次数
- 包次数

注意：
- `good_count` 对应“好次”
- `bad_count` 对应“包次”

---

## 2. shop_images
店铺图片表。

作用：
- 存首图
- 存后续补图

设计上，新增店铺时：
- `shops.cover_image_url` 是主封面
- 触发器会自动把这张图也写进 `shop_images`

这样以后店铺详情页查图片列表时，只查 `shop_images` 就够了。

---

## 3. shop_votes
投票表。

字段重点：
- `shop_id`
- `voter_key`
- `vote_type`

其中：
- `vote_type = 'good'` 表示“好次”
- `vote_type = 'bad'` 表示“包次”

并且加了唯一约束：
- `unique (shop_id, voter_key)`

这表示：
**同一个人对同一家店只能保留一条投票记录。**

---

## 投票逻辑怎么配合前端

## 场景 1，用户第一次投票
直接 `insert into shop_votes`

## 场景 2，用户重复点同一种票
前端先查当前投票状态，如果已经是同类票，就直接提示：
- 你已经点过“好次”了
- 或者 你已经点过“包次”了

## 场景 3，用户改票
执行：
- `update shop_votes set vote_type = 'good' ...`
- 或 `update shop_votes set vote_type = 'bad' ...`

数据库会自动刷新 `shops.good_count` / `shops.bad_count`

---

## 为什么这版没有单独做 users / profiles
因为这是 MVP。

先把闭环跑通最重要。
第一版建议：
- 上传时填昵称
- 补图时填昵称
- 投票时用匿名设备标识 `voter_key`

以后如果要升级登录体系，再补：
- `profiles`
- `auth.users` 关联
- 更严格的权限控制

---

## 下一步最该做什么

我建议下一步直接做这两个之一：

### 方案 A
补一份 **Supabase RLS / Storage 规则 v1**

适合马上准备真接 Supabase。

### 方案 B
开始建 **Next.js 项目骨架**

适合先把前端页面跑起来。

如果按开发顺序，我更建议先补：
**RLS + Storage 规则**

因为图片上传和表写入会马上用到。
