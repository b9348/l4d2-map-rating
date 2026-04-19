import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, accounts } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

// 解析 OpenID 响应
function parseOpenIdResponse(url: string): Record<string, string> {
  const params = new URLSearchParams(new URL(url).search)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    if (key.startsWith("openid.")) {
      result[key] = value
    }
  })
  
  return result
}

// 从 Steam ID 提取 64 位 ID
function extractSteamId64(openidUrl: string): string | null {
  // Steam OpenID 返回的格式: https://steamcommunity.com/openid/id/76561198XXXXXXXXX
  const match = openidUrl.match(/\/id\/(\d+)/)
  return match ? match[1] : null
}

// 获取 Steam 用户信息（可选，使用 Steam API）
async function getSteamUserProfile(steamId64: string) {
  const apiKey = process.env.AUTH_STEAM_ID
  if (!apiKey) return null
  
  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId64}`
    )
    const data = await response.json()
    return data.response?.players?.[0] || null
  } catch (error) {
    console.error("Failed to fetch Steam profile:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("openid.mode")
  
  // 验证 OpenID 响应
  if (mode !== "id_res") {
    return NextResponse.redirect(
      new URL("/auth/signin?error=InvalidOpenIdResponse", request.url)
    )
  }
  
  // 解析 OpenID 参数
  const openidParams = parseOpenIdResponse(request.url)
  const claimedId = openidParams["openid.claimed_id"]
  const identity = openidParams["openid.identity"]
  
  if (!claimedId || !identity) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=MissingOpenIdParams", request.url)
    )
  }
  
  // 提取 Steam ID
  const steamId64 = extractSteamId64(claimedId)
  if (!steamId64) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=InvalidSteamId", request.url)
    )
  }
  
  try {
    // 获取 Steam 用户详细信息
    const steamProfile = await getSteamUserProfile(steamId64)
    
    const userData = {
      id: steamId64,
      name: steamProfile?.personaname || `Steam User ${steamId64.slice(-4)}`,
      email: null,
      image: steamProfile?.avatarfull || null,
      steamId: steamId64,
    }
    
    // 检查用户是否已存在
    let user = await db.query.users.findFirst({
      where: eq(users.steamId, steamId64),
    })
    
    if (!user) {
      // 创建新用户
      const newUserId = crypto.randomUUID()
      await db
        .insert(users)
        .values({
          id: newUserId,
          steamId: steamId64,
          name: userData.name,
          avatar: userData.image,
        })
      
      user = await db.query.users.findFirst({
        where: eq(users.id, newUserId),
      })
      
      // 创建账户关联
      if (user) {
        await db.insert(accounts).values({
          userId: user.id,
          type: "oauth",
          provider: "steam",
          providerAccountId: steamId64,
          access_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          id_token: null,
          session_state: null,
        })
      }
    } else {
      // 更新用户信息
      await db
        .update(users)
        .set({
          name: userData.name,
          avatar: userData.image,
        })
        .where(eq(users.id, user.id))
      
      // 检查账户关联是否存在
      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.providerAccountId, steamId64),
      })
      
      if (!existingAccount) {
        await db.insert(accounts).values({
          userId: user.id,
          type: "oauth",
          provider: "steam",
          providerAccountId: steamId64,
          access_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          id_token: null,
          session_state: null,
        })
      }
    }
    
    if (!user) {
      throw new Error("Failed to create or find user")
    }
    
    // 创建 JWT Session
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
      throw new Error("AUTH_SECRET is not configured")
    }
    
    const token = await new SignJWT({
      sub: user.id,
      name: user.name,
      picture: user.avatar,
      steamId: steamId64,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(secret))
    
    // 设置 cookie
    const cookieStore = await cookies()
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    
    // 重定向到首页
    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Steam authentication error:", error)
    return NextResponse.redirect(
      new URL("/auth/signin?error=AuthenticationFailed", request.url)
    )
  }
}
