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
- `@auth/drizzle-adapter` 负责把 NextAuth 会话持久化到上述表。
- `maps.images` 是 **JSON 字符串列**,读写都要手动 `JSON.parse` / `JSON.stringify`(参考 `src/app/api/maps/route.ts`)。

## 认证 — Steam OpenID 2.0 的适配 hack

`src/lib/auth.ts` 同时启用 GitHub OAuth 和自定义 Steam provider。Steam 本质是 **OpenID 2.0**,非 OIDC,因此用了一组变通:

- `type: "oidc"` 外壳 + 占位 `clientId/clientSecret: "0"` 满足 NextAuth 校验
- `checks: []` 关闭 state 校验(否则 Steam 回调失败)
- `openid.realm` / `return_to` 依赖 `NEXTAUTH_URL`,默认落回 `https://l4d.gta4.bio`
- `profile(profile)` 从 `steamid / personaname / avatarfull` 映射

改动 auth 配置时先理解这些约束,别按 OIDC 规范"修正"它们 —— 已经踩过坑(见 commit `f9f5a8b`、`c4c0eec`)。

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

必需:`AUTH_SECRET`(或旧名 `NEXTAUTH_SECRET`)、`NEXTAUTH_URL`、`DATABASE_URL`、`AUTH_GITHUB_ID`、`AUTH_GITHUB_SECRET`。Steam 不需要 OAuth secret,但 `AUTH_STEAM_ID`(Steam Web API key)用于后续扩展。`.env.local` 已被 `.gitignore`。
