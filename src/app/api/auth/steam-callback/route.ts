import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, accounts, sessions } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"

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
  const match = openidUrl.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/)
  return match ? match[1] : null
}

// 向 Steam 回传 check_authentication 请求以验证签名
// OpenID 2.0 要求这一步;省略它就等于完全信任客户端提交的参数,
// 任何人都能伪造 claimed_id 冒充任意 Steam 账号登录
async function verifyOpenIdSignature(
  openidParams: Record<string, string>
): Promise<boolean> {
  const body = new URLSearchParams(openidParams)
  body.set("openid.mode", "check_authentication")

  try {
    const response = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    const text = await response.text()
    // Steam 返回 key:value\n 格式文本
    return /^is_valid\s*:\s*true\s*$/m.test(text)
  } catch (error) {
    console.error("Steam OpenID verification failed:", error)
    return false
  }
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

  if (mode !== "id_res") {
    return NextResponse.redirect(
      new URL("/auth/signin?error=InvalidOpenIdResponse", request.url)
    )
  }

  const openidParams = parseOpenIdResponse(request.url)
  const claimedId = openidParams["openid.claimed_id"]
  const identity = openidParams["openid.identity"]

  if (!claimedId || !identity) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=MissingOpenIdParams", request.url)
    )
  }

  // 限定 OP 端点必须是 Steam,防止攻击者把 op_endpoint 指向自建服务绕过校验
  if (openidParams["openid.op_endpoint"] !== "https://steamcommunity.com/openid/login") {
    return NextResponse.redirect(
      new URL("/auth/signin?error=InvalidOpEndpoint", request.url)
    )
  }

  const isValid = await verifyOpenIdSignature(openidParams)
  if (!isValid) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=InvalidSignature", request.url)
    )
  }

  const steamId64 = extractSteamId64(claimedId)
  if (!steamId64) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=InvalidSteamId", request.url)
    )
  }

  try {
    const steamProfile = await getSteamUserProfile(steamId64)
    const displayName = steamProfile?.personaname || `Steam User ${steamId64.slice(-4)}`
    const imageUrl = steamProfile?.avatarfull || null

    let user = await db.query.users.findFirst({
      where: eq(users.steamId, steamId64),
    })

    if (!user) {
      const newUserId = crypto.randomUUID()
      await db.insert(users).values({
        id: newUserId,
        steamId: steamId64,
        name: displayName,
        image: imageUrl,
      })

      user = await db.query.users.findFirst({
        where: eq(users.id, newUserId),
      })

      if (user) {
        await db.insert(accounts).values({
          userId: user.id,
          type: "oauth",
          provider: "steam",
          providerAccountId: steamId64,
        })
      }
    } else {
      await db
        .update(users)
        .set({ name: displayName, image: imageUrl })
        .where(eq(users.id, user.id))

      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.providerAccountId, steamId64),
      })

      if (!existingAccount) {
        await db.insert(accounts).values({
          userId: user.id,
          type: "oauth",
          provider: "steam",
          providerAccountId: steamId64,
        })
      }
    }

    if (!user) {
      throw new Error("Failed to create or find user")
    }

    // 写 NextAuth database session:sessionToken 既是表主键也是 cookie 值
    // auth() 读到 cookie 后会去 sessions 表回查
    const sessionToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await db.insert(sessions).values({
      sessionToken,
      userId: user.id,
      expires,
    })

    const cookieStore = await cookies()
    cookieStore.set("authjs.session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires,
    })

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Steam authentication error:", error)
    return NextResponse.redirect(
      new URL("/auth/signin?error=AuthenticationFailed", request.url)
    )
  }
}
