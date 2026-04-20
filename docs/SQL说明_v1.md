# Supabase SQL 说明 v1

文件位置：`supabase_schema_v1.sql`

## 这版做了什么

当前 SQL 只覆盖 MVP 需要的 3 张表：
- `shops`
- `shop_images`
- `shop_votes`

并且额外做了 2 件实用的事：
- 自动维护 `updated_at`
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

当前建议做法：
- `shops.cover_image_url` 仍作为主封面
- 前端在创建店铺成功后，如有需要，再显式插入一条 `shop_images`

这样可以避开数据库 trigger 与 RLS 的耦合问题，MVP 更稳。

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

## 额外提醒

如果你启用了 RLS，MVP 阶段不建议再让 `shops` 的 after insert trigger 自动写 `shop_images`。

更稳的方式是：
- 前端先创建 `shops`
- 成功后再单独写 `shop_images`

这样报错路径更清晰，也更容易排查权限问题。
