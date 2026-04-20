import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'

// 配置常量
const JWT_SECRET = process.env.AUTH_SECRET
const COOKIE_NAME = 'auth_token'
const TOKEN_EXPIRY = '30d'
const TOKEN_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

if (!JWT_SECRET) {
  throw new Error('AUTH_SECRET 环境变量未配置')
}

export interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  steamId: string | null
}

export interface Session {
  user: User
  expires: Date
}

interface TokenPayload {
  userId: string
  steamId: string | null
  iat?: number
  exp?: number
}

/**
 * 生成 JWT token
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      steamId: user.steamId,
    },
    JWT_SECRET as string,
    { expiresIn: TOKEN_EXPIRY }
  )
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string)
    return decoded as TokenPayload
  } catch {
    return null
  }
}

/**
 * 从数据库获取用户信息
 */
async function getUserById(userId: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    steamId: user.steamId,
  }
}

/**
 * 从 cookie 获取会话
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  const user = await getUserById(decoded.userId)
  if (!user) {
    return null
  }

  return {
    user,
    expires: new Date(Date.now() + TOKEN_MAX_AGE * 1000),
  }
}

/**
 * 设置认证 cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  })
}

/**
 * 清除认证 cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
