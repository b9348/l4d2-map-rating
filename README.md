# L4D2 地图推荐评分站

一个基于 Next.js 15 构建的 Left 4 Dead 2 自定义地图推荐和评分平台。

## 功能特性

- 🔐 Steam OAuth 登录认证
- 🗺️ 地图提交与展示(支持最多9张截图)
- ⭐ 0-5星评分系统(未登录可打分,登录可写评语)
- 🔍 搜索和筛选功能
- 📱 响应式设计,完美适配手机/平板/桌面
- 🎨 现代化UI,支持暗色模式
- ⚡ 性能优化(SWR缓存、图片懒加载、路由预取)

## 技术栈

- **框架**: Next.js 15 (App Router)
- **认证**: NextAuth.js v5 + Steam OpenID
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **数据库**: MySQL 8 (SQLPub)
- **ORM**: Drizzle ORM
- **状态管理**: SWR
- **表单**: React Hook Form + Zod
- **部署**: 腾讯云 EdgeOne Pages

## 快速开始

### 前置要求

- Node.js 18+ 
- pnpm
- MySQL 8 数据库

### 安装步骤

1. **克隆项目**
```bash
cd l4d2-map-rating
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**

复制 `.env.local` 文件并填写实际配置:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Steam API - 从 https://steamcommunity.com/dev/apikey 获取
STEAM_API_KEY=your-steam-api-key

# Database (SQLPub MySQL)
DATABASE_URL="mysql://user:password@host:port/database"

# Image Host Recommendation Link
IMAGE_HOST_RECOMMENDATION_URL=https://sm.ms/
```

4. **初始化数据库**

```bash
# 同步数据库架构(首次运行)
pnpm exec drizzle-kit push
```

5. **启动开发服务器**

```bash
pnpm dev
```

访问 http://localhost:3000 查看应用。

## 数据库架构

项目使用三个主要模型:

- **User**: 用户信息(通过Steam登录自动创建)
- **Map**: 地图信息(名称、描述、图片、评分统计)
- **Rating**: 评分记录(分数、评语、关联用户)

## API 端点

### 地图 API

- `GET /api/maps` - 获取地图列表(支持分页、搜索、排序)
- `GET /api/maps?id={id}` - 获取单个地图详情
- `POST /api/maps` - 创建新地图(需登录)

### 评分 API

- `GET /api/ratings?mapId={id}` - 获取某地图的所有评分
- `POST /api/ratings` - 提交评分

### 认证 API

- `/api/auth/signin` - 登录页面
- `/api/auth/callback/steam` - Steam OAuth 回调 (由 next-auth-steam 自动处理)

## 部署到 EdgeOne

1. **构建项目**
```bash
pnpm build
```

2. **配置 EdgeOne**
   - 在腾讯云控制台创建 EdgeOne Pages 项目
   - 连接 Git 仓库或直接上传构建产物
   - 配置环境变量(NEXTAUTH_SECRET, DATABASE_URL, STEAM_API_KEY等)

3. **设置域名和SSL**
   - 绑定自定义域名(可选)
   - EdgeOne 自动提供 SSL 证书

## 项目结构

```
l4d2-map-rating/
├── src/
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── (main)/            # 主页面(带导航)
│   │   │   ├── maps/
│   │   │   │   ├── [id]/      # 地图详情页
│   │   │   │   └── submit/    # 提交地图页
│   │   │   ├── page.tsx       # 首页
│   │   │   └── layout.tsx     # 主布局
│   │   ├── auth/
│   │   │   └── signin/        # 登录页
│   │   └── layout.tsx         # 根布局
│   ├── components/
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── Navbar.tsx         # 导航栏
│   │   ├── MapCard.tsx        # 地图卡片
│   │   ├── RatingStars.tsx    # 星级评分
│   │   ├── RatingModal.tsx    # 评分弹窗
│   │   ├── ImageGallery.tsx   # 图片画廊
│   │   └── SearchFilter.tsx   # 搜索过滤
│   ├── lib/
│   │   ├── db.ts              # Drizzle 客户端
│   │   ├── schema.ts          # 数据库模型定义
│   │   ├── auth.ts            # NextAuth 配置
│   │   ├── validations.ts     # Zod schemas
│   │   └── utils.ts           # 工具函数
│   └── types/
│       └── index.ts           # TypeScript 类型
└── .env.local                 # 环境变量
```

## 注意事项

### Steam API Key

需要从 Steam Web API 获取密钥:
1. 访问 https://steamcommunity.com/dev/apikey
2. 登录 Steam 账号
3. 输入域名(本地开发用 localhost)
4. 复制生成的密钥到 `STEAM_API_KEY`

### 数据库配置

本项目设计用于 SQLPub 免费 MySQL 数据库,但也可以使用任何 MySQL 8 实例。

修改 `.env.local` 中的 `DATABASE_URL`:
```
DATABASE_URL="mysql://username:password@host:port/database_name"
```

### 图片存储

当前版本使用外链方式存储图片URL。建议用户使用稳定的图床服务:
- sm.ms (免费,推荐)
- Imgur
- Cloudinary

未来可以集成对象存储(如腾讯云COS)实现直接上传。

## 性能优化

- ✅ SWR 智能数据缓存
- ✅ Next.js Image 组件优化图片加载
- ✅ 路由预取(prefetch)
- ✅ 代码分割和懒加载
- ✅ ISR (增量静态再生)就绪

## 后续扩展

- [ ] 用户个人主页
- [ ] 地图收藏功能
- [ ] 评论回复系统
- [ ] 管理员后台
- [ ] 地图标签分类
- [ ] 直接图片上传(集成COS)
- [ ] 社交分享功能
- [ ] 地图版本历史

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request!

---

**提示**: 在生产环境部署前,请务必:
1. 更改 `NEXTAUTH_SECRET` 为强随机字符串
2. 配置正确的 `NEXTAUTH_URL` 为你的域名
3. 使用生产环境的数据库
4. 启用 HTTPS
