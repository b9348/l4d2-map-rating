import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许外部图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // 腾讯云 EdgeOne 等平台通常使用 Serverless/Edge 环境，默认输出 standalone 模式以优化部署
  output: 'standalone',
  // 确保 Prisma Client 在 standalone 模式下被正确追踪和打包
  outputFileTracingRoot: undefined,
};

export default nextConfig;
