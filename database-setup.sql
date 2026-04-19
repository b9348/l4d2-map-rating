-- L4D2 Map Rating 数据库初始化脚本
-- 使用前请修改数据库名称

CREATE DATABASE IF NOT EXISTS l4d2_map_rating CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE l4d2_map_rating;

-- 注意: 实际的表结构会通过 Prisma 自动创建
-- 运行以下命令来同步数据库架构:
-- pnpm exec drizzle-kit push
