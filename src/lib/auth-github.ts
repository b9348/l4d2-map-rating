import { db } from '@/lib/db'
import { users, accounts } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from './auth-custom'
import { nanoid } from 'nanoid'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error('GitHub OAuth 凭据未配置')
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

// 获取 GitHub access token
async function getGitHubAccessToken(code: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error_description || 'Failed to get access token')
  }

  return data.access_token
}

// 获取 GitHub 用户信息
async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user')
  }

  return response.json()
}

// 获取 GitHub 用户邮箱
async function getGitHubEmails(accessToken: string): Promise<string> {
  const response = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    return ''
  }

  const emails = await response.json()
  const primaryEmail = emails.find((e: any) => e.primary && e.verified)
  return primaryEmail?.email || ''
}

// 处理 GitHub 登录回调
export async function handleGitHubCallback(code: string): Promise<{ token: string; redirectUrl: string }> {
  // 1. 获取 access token
  const accessToken = await getGitHubAccessToken(code)

  // 2. 获取用户信息
  const githubUser = await getGitHubUser(accessToken)
  const email = await getGitHubEmails(accessToken)

  // 3. 检查用户是否已存在
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, githubUser.email || `${githubUser.id}@github.com`))
    .limit(1)

  if (!user) {
    // 创建新用户
    const userId = nanoid()
    const now = new Date()

    await db.insert(users).values({
      id: userId,
      name: githubUser.name || githubUser.login,
      email: githubUser.email || `${githubUser.id}@github.com`,
      image: githubUser.avatar_url,
      createdAt: now,
      updatedAt: now,
    })

    user = {
      id: userId,
      steamId: null,
      name: githubUser.name || githubUser.login,
      email: githubUser.email || `${githubUser.id}@github.com`,
      emailVerified: null,
      image: githubUser.avatar_url,
      createdAt: now,
      updatedAt: now,
    }
  }

  // 4. 创建或更新 account 记录
  const [existingAccount] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.providerAccountId, githubUser.id.toString()))
    .limit(1)

  if (!existingAccount) {
    await db.insert(accounts).values({
      userId: user.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: githubUser.id.toString(),
      access_token: accessToken,
    })
  }

  // 5. 生成 JWT token
  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    steamId: user.steamId,
  })

  return {
    token,
    redirectUrl: '/',
  }
}
