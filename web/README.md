# 徐州美食地图 Web

这是“徐州美食地图”的前端骨架项目。

## 当前状态

当前已完成：
- Next.js App Router 初始化
- 首页骨架
- 手绘感地图占位组件
- 店铺详情抽屉组件
- 店铺列表卡片组件
- 上传店铺占位面板
- Supabase 环境变量占位
- Supabase 匿名登录骨架
- `shops` 表读取骨架，失败时自动回退 mock 数据

当前未完成：
- 高德地图真实接入
- 上传店铺表单
- 图片上传
- 好次 / 包次真实投票

## 启动方式

```bash
npm install
npm run dev
```

## 环境变量

复制 `.env.example` 为 `.env.local`，然后填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_AMAP_KEY=
```

## 下一步建议

1. 接高德地图
2. 接 Supabase 匿名登录
3. 用 `shops` 表替换 mock 数据
4. 接上传店铺弹窗
5. 接投票逻辑
