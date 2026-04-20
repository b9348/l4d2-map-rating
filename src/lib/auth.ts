import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"

// Steam 是 OpenID 2.0,不是 OAuth/OIDC。NextAuth 原生不支持,
// 用 type: "oauth" 外壳来构造初始跳转 URL。
// 真正的 OpenID 2.0 响应解析在 /api/auth/steam-callback/route.ts,
// NextAuth 的 OAuth 流程永远不会被触达(因为 checks: []),所以占位字段运行时无副作用。
const SteamProvider = {
  id: "steam",
  name: "Steam",
  type: "oauth" as const,
  version: "2.0",
  clientId: "0",
  clientSecret: "0",
  authorization: {
    url: "https://steamcommunity.com/openid/login",
    params: () => {
      const baseUrl = process.env.NEXTAUTH_URL || "https://l4d.gta4.bio"
      return {
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.mode": "checkid_setup",
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.realm": baseUrl,
        // 使用不同的回调路径,避免与 NextAuth 默认路由冲突
        "openid.return_to": `${baseUrl}/api/auth/steam-callback`,
      }
    },
  },
  // Steam 回调不带 state/code,必须关掉 NextAuth 默认的 state/PKCE/code 校验
  // 这样 NextAuth 只会帮忙构造跳转 URL,不会处理回调
  checks: [],
  token: { url: "" }, // 占位,不会被调用
  userinfo: { url: "" }, // 占位,不会被调用
  profile: () => ({}), // 占位,不会被调用
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "database" },
  // 锁定 session cookie 名,使 Steam 自定义回调写入的 token 能被 auth() 读回
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    SteamProvider as never,
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      // steamId 是 User 表自定义字段;database 策略下 user 是完整 DB 行
      const steamId = (user as { steamId?: string | null }).steamId
      if (steamId) {
        session.user.steamId = steamId
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})
