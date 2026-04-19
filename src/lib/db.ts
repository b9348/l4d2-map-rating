import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// 创建连接池 (Serverless 友好)
const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10, // 根据数据库配额调整
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
