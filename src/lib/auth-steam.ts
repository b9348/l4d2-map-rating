import { db } from '@/lib/db'
import { users, accounts } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from './auth-custom'
import { nanoid } from 'nanoid'

const STEAM_API_KEY = process.env.STEAM_API_KEY
const PROD_URL = process.env.PROD_URL

if (!STEAM_API_KEY) {
  throw new Error('Steam API Key 未配置')
}

if (!PROD_URL) {
  throw new Error('PROD_URL 环境变量未配置')
}

interface SteamUser {
  steamid: string
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
}

// 生成 OpenID 认证 URL
export function getSteamAuthUrl(returnUrl: string): string {
  const realm = new URL(returnUrl).origin
  const returnTo = `${returnUrl}/api/auth/callback/steam`

  const params = new URLSearchParams({
    'openid.mode': 'checkid_setup',
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.return_to': returnTo,
    'openid.realm': realm,
  })

  return `https://steamcommunity.com/openid/login?${params.toString()}`
}

// 验证 OpenID 响应并提取 Steam ID
export function validateOpenIdResponse(query: URLSearchParams): string | null {
  // 检查是否是有效的 OpenID 响应
  if (query.get('openid.mode') !== 'id_res') {
    return null
  }

  // 从 openid.claimed_id 提取 Steam ID
  const claimedId = query.get('openid.claimed_id')
  if (!claimedId) {
    return null
  }

  const match = claimedId.match(/\/id\/(\d+)$/)
  if (!match) {
    return null
  }

  return match[1]
}

// 获取 Steam 用户信息
async function getSteamUser(steamId: string): Promise<SteamUser> {
  const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002')
  url.searchParams.set('key', STEAM_API_KEY as string)
  url.searchParams.set('steamids', steamId)

  let lastError: Error | null = null
  
  // 最多重试 3 次
  for (let i = 0; i < 3; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Steam API 请求失败: ${response.status}`)
      }

      const data = await response.json()

      if (!data.response?.players?.[0]) {
        throw new Error('未找到 Steam 用户信息')
      }

      return data.response.players[0]
    } catch (error) {
      lastError = error as Error
      if (i < 2) {
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  
  throw lastError || new Error('获取 Steam 用户信息失败')
}

// 处理 Steam 登录回调
export async function handleSteamCallback(query: URLSearchParams): Promise<{ token: string; redirectUrl: string }> {
  // 1. 验证 OpenID 响应并获取 Steam ID
  const steamId = validateOpenIdResponse(query)
  
  if (!steamId) {
    throw new Error('无效的 Steam OpenID 响应')
  }

  // 2. 获取 Steam 用户信息
  const steamUser = await getSteamUser(steamId)

  // 3. 检查用户是否已存在
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.steamId, steamId))
    .limit(1)

  if (!user) {
    // 创建新用户
    const userId = nanoid()
    const now = new Date()

    await db.insert(users).values({
      id: userId,
      steamId: steamId,
      name: steamUser.personaname,
      email: `${steamId}@steamcommunity.com`,
      image: steamUser.avatarfull,
      createdAt: now,
      updatedAt: now,
    })

    user = {
      id: userId,
      steamId: steamId,
      name: steamUser.personaname,
      email: `${steamId}@steamcommunity.com`,
      emailVerified: null,
      image: steamUser.avatarfull,
      createdAt: now,
      updatedAt: now,
    }
  }

  // 4. 创建或更新 account 记录
  const [existingAccount] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.providerAccountId, steamId))
    .limit(1)

  if (!existingAccount) {
    await db.insert(accounts).values({
      userId: user.id,
      type: 'oauth',
      provider: 'steam',
      providerAccountId: steamId,
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
    redirectUrl: `${PROD_URL}/`,
  }
}
