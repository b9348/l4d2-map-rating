# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ 版本警告 — 读文档再写代码

本项目使用 **Next.js 16.2.4 + React 19.2.4 + NextAuth v5 beta**,这些版本都带有破坏性变更,与训练数据可能差异巨大。动笔前先查 `node_modules/next/dist/docs/` 里对应的文档,尤其是 App Router、Server Actions、Route Handlers 部分。留心 deprecation 提示。

## 常用命令

```bash
pnpm dev                   # 开发服务器 (注意:用户环境中勿主动启动)
pnpm build                 # 生产构建 (output: 'standalone')
pnpm start                 # 运行生产构建
pnpm lint                  # ESLint
pnpm exec drizzle-kit push # 同步 schema 到 MySQL (无 test 脚本)
```

包管理器固定 **pnpm**(`pnpm-workspace.yaml` 存在)。无测试框架。

## 数据层

**Drizzle ORM + mysql2 连接池**。

- Schema 单一来源:`src/lib/schema.ts`(含 User / Map / Rating 及 NextAuth 所需的 Account / Session / VerificationToken 表)
- 连接池:`src/lib/db.ts`,`drizzle(..., { mode: 'default' })`
- **根目录暂无 `drizzle.config.ts`**。运行 `drizzle-kit push` 前需补齐配置,或通过 CLI 参数传入。
- `@auth/drizzle-adapter` 负责把 NextAuth 会话持久化到上述表。要求 `User` 表 JS key 必须是 `id/name/email/emailVerified/image`;当前 schema 把 `image` 的 SQL 列名故意映射成 `avatar` 以兼容历史数据,改动时别把 JS key 改回 `avatar`。
- `maps.images` 是 **JSON 字符串列**,读写都要手动 `JSON.parse` / `JSON.stringify`(参考 `src/app/api/maps/route.ts`)。

## 认证 — Steam OpenID 2.0 + NextAuth 数据库会话

NextAuth v5 原生不支持 OpenID 2.0,采用分工方案:

- **出站重定向**走 NextAuth:`src/lib/auth.ts` 里 `SteamProvider` 是个极简 `type: "oauth"` 壳,只定义 `authorization.url` / `params`,供 `signIn('steam')` 构造跳转到 `steamcommunity.com/openid/login`。`token` / `userinfo` / `profile` 不存在(NextAuth 不会走到)。
- **入站回调**完全自定义:`src/app/api/auth/steam-callback/route.ts` 接管 Steam 回来的 `GET`,做三件事:
  1. 向 `steamcommunity.com/openid/login` 回传 `openid.mode=check_authentication` **验签**,找 `is_valid:true`。**这一步不能省**,否则任何人都能伪造 `claimed_id` 冒充任意 Steam 账号(历史漏洞)。
  2. 另校验 `openid.op_endpoint` 是否为官方 Steam 端点,防止 op_endpoint 指向攻击者自建服务。
  3. upsert 到 `users` / `accounts`,然后插 `sessions` 行,把 `sessionToken` 写入 `authjs.session-token` cookie。
- **Session 策略统一为 database**:`auth.ts` 显式 `session: { strategy: "database" }`,并通过 `cookies.sessionToken.name` 锁定 cookie 名,确保 Steam 自定义写入的 token 能被 `auth()` 正确读回。GitHub 走 NextAuth 标准流程,落到同一张 `sessions` 表。
- `session` 回调接收的是 `{ session, user }`(不是 token),`user` 是完整的 DB 行,`steamId` 就是它上面的自定义字段。

改动 auth 配置时记住:GitHub 与 Steam 两条通路最终都必须写出同一个 `authjs.session-token` cookie 且指向 `sessions` 表主键,否则其中一边的 session 会读不出来。

## 前端约定

- **App Router**,`src/app/(main)/` 分组承载带 Navbar 的主界面;`src/app/auth/` 是不带 Navbar 的登录页。
- 数据拉取一律走 `src/lib/http.ts` 的 `api.get/post/put/delete`,它会对非 2xx 自动 `toast.error`,失败抛 `HttpError`。组件里**不要再包 try/catch 弹 toast**。
- 客户端状态/缓存用 **SWR**;表单用 `react-hook-form + zodResolver(@/lib/validations)`。
- UI 基于 **shadcn/ui**(new-york 风格,`components.json`),图标 `lucide-react`,toasts `sonner`。Tailwind v4(PostCSS 插件模式)。
- 路径别名:`@/* → src/*`。

## 未完成的占位

以下目录当前为空,表示计划中未实现的路由,不要假设已有逻辑:
`src/app/api/maps/[id]/`、`src/app/api/ratings/[id]/`、`src/app/api/profile/`、`src/app/(main)/profile/`。

当前 `GET /api/maps?id=<id>` 同时承担列表和单项查询(见 `src/app/api/maps/route.ts`)—— 将来拆分到 `[id]/route.ts` 时需同步更新前端调用。

## 部署

目标平台腾讯云 **EdgeOne Pages**,`next.config.ts` 设置 `output: 'standalone'`,`images.remotePatterns` 放开了全部 http/https 域名(因为用户提交的是外链图床 URL)。

## 环境变量

必需:`AUTH_SECRET`(或旧名 `NEXTAUTH_SECRET`)、`NEXTAUTH_URL`、`DATABASE_URL`、`AUTH_GITHUB_ID`、`AUTH_GITHUB_SECRET`、`AUTH_STEAM_ID`(Steam Web API key,用于获取用户头像和昵称)。`.env.local` 已被 `.gitignore`。
