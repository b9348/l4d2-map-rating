# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Left 4 Dead 2 地图评分系统，使用 Next.js 16 + React 19 + TypeScript 构建，支持 Steam 和 GitHub OAuth 登录，允许用户（包括游客）对地图进行评分和评论。

## 技术栈

- **框架**: Next.js 16.2.4 (App Router)
- **UI**: React 19, Tailwind CSS 4, Radix UI, Framer Motion
- **数据库**: MySQL + Drizzle ORM
- **认证**: 自定义 JWT 认证系统 (Steam OAuth, GitHub OAuth)
- **缓存**: EdgeOne KV (兼容 Cloudflare KV)
- **部署**: 腾讯云 EdgeOne Pages (Serverless/Edge)

## 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器 (localhost:3000)

# 构建和生产
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 代码质量
pnpm lint             # 运行 ESLint

# 数据库
pnpm exec drizzle-kit push      # 同步数据库 schema 到 MySQL
pnpm exec drizzle-kit generate  # 生成迁移文件
pnpm exec drizzle-kit studio    # 启动 Drizzle Studio (数据库 GUI)
```

## 核心架构

### 认证系统 (`src/lib/auth-*.ts`)

- **自定义 JWT 认证**: 不使用 NextAuth，使用 `jsonwebtoken` 生成和验证 token
- **多提供商支持**: Steam OAuth (`auth-steam.ts`) 和 GitHub OAuth (`auth-github.ts`)
- **游客支持**: 通过 `guest-id.ts` 生成持久化游客 ID，存储在 cookie 中
- **会话管理**: `auth-custom.ts` 提供 `getSession()`, `setAuthCookie()`, `clearAuthCookie()`
- **认证流程**:
  1. 用户点击登录 → `/api/auth/signin/{provider}` 重定向到 OAuth 提供商
  2. 回调 → `/api/auth/callback/{provider}` 处理授权码，创建/更新用户，生成 JWT
  3. JWT 存储在 `auth_token` cookie (httpOnly, 30天有效期)

### 数据库层 (`src/lib/db.ts`, `src/lib/schema.ts`)

- **连接池**: 使用 `mysql2/promise` 创建全局单例连接池，限制 5 个连接
- **Schema**: Drizzle ORM 定义，包含 `users`, `maps`, `ratings`, `guestIds` 等表
- **索引策略**: 
  - `Map`: `submitterId`, `createdAt`, `averageRating` 索引
  - `Rating`: `mapId`, `userId`, `guestId` 索引
- **字段映射**: `users.image` 字段在数据库中实际列名为 `avatar`（历史遗留）

### 缓存系统 (`src/lib/cache.ts`)

- **KV 存储**: 支持 EdgeOne KV 和 Cloudflare KV
- **缓存策略**: 默认 TTL 5 分钟
- **使用场景**: 
  - 首页地图列表 (`maps:list:home`)
  - 搜索结果 (`maps:list:search:*`)
  - 统计数据 (`stats`)
- **缓存失效**: 数据变更时调用 `deleteCacheByPrefix()` 清除相关缓存
- **降级处理**: KV 不可用时自动降级到直接查询数据库

### HTTP 请求封装 (`src/lib/http.ts`)

- **统一错误处理**: `HttpError` 类封装错误信息，自动显示 toast 提示
- **便捷方法**: `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- **安全执行器**: `safeAsync()` 返回 `[error, data]` 元组，避免组件内 try-catch

### 路由结构

```
src/app/
├── (main)/                    # 主应用布局组
│   ├── layout.tsx            # 包含 Navbar
│   ├── page.tsx              # 首页 (地图列表)
│   └── maps/
│       ├── [id]/page.tsx     # 地图详情页
│       └── submit/page.tsx   # 提交地图页
├── auth/
│   └── signin/page.tsx       # 登录页
└── api/
    ├── auth/                 # 认证相关 API
    ├── maps/                 # 地图 CRUD
    ├── ratings/              # 评分 CRUD
    ├── stats/                # 统计数据
    └── guest-id/             # 游客 ID 生成
```

## 环境变量

复制 `.env.example` 到 `.env.local` 并填写：

- `AUTH_SECRET`: JWT 签名密钥（生产环境必须使用强随机字符串）
- `DATABASE_URL`: MySQL 连接字符串
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: GitHub OAuth 凭证
- `STEAM_API_KEY`: Steam API 密钥
- `PROD_URL`: 生产环境域名（用于 OAuth 回调）
- `IMAGE_HOST_RECOMMENDATION_URL`: 图片托管服务推荐 URL

## 开发注意事项

### 数据库操作

- 修改 schema 后必须运行 `pnpm exec drizzle-kit push` 同步到数据库
- 连接池限制为 5 个连接，避免超过数据库 `max_user_connections` (30)
- 所有时间字段使用 `datetime(fsp: 3)` 精确到毫秒

### 认证和授权

- 使用 `getSession()` 获取当前用户会话（服务端组件和 API 路由）
- 游客评分需要先调用 `/api/guest-id` 获取游客 ID
- JWT token 有效期 30 天，存储在 httpOnly cookie 中

### 缓存策略

- 读多写少的数据（地图列表、统计）使用 KV 缓存
- 数据变更后调用 `deleteCacheByPrefix()` 清除相关缓存
- 缓存失败不影响主流程，自动降级到数据库查询

### 部署

- 项目配置为 `output: 'standalone'` 模式，适合 Serverless/Edge 部署
- 支持腾讯云 EdgeOne Pages 和 Cloudflare Pages
- 图片使用外部托管服务，配置在 `next.config.ts` 的 `remotePatterns`

### 错误处理

- API 路由统一返回 `{ error: string }` 或 `{ data: T }`
- 客户端使用 `safeAsync()` 包装异步请求，避免未捕获的 Promise rejection
- 全局错误通过 `sonner` toast 显示
