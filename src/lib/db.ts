import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// 全局单例连接池，防止热重载时重复创建连接
const globalForDb = globalThis as unknown as {
  poolConnection?: mysql.Pool;
};

const poolConnection =
  globalForDb.poolConnection ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 5, // 降低连接数，避免超过数据库 max_user_connections (30)
    enableKeepAlive: true,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.poolConnection = poolConnection;

export const db = drizzle(poolConnection, { schema, mode: 'default' });
