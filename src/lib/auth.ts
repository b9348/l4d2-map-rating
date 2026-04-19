import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"

// Steam OpenID 2.0 自定义 Provider
// 注意：实际的 Steam OpenID 处理在 /api/auth/callback/steam/route.ts 中完成
const SteamProvider = {
  id: "steam",
  name: "Steam",
  type: "oauth" as const,
  authorization: {
    url: "https://steamcommunity.com/openid/login",
    params: (request: any) => {
      const baseUrl = process.env.NEXTAUTH_URL || "https://l4d.gta4.bio"
      return {
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.mode": "checkid_setup",
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.realm": baseUrl,
        "openid.return_to": `${baseUrl}/api/auth/callback/steam`,
      }
    },
  },
  // 这些端点不会被调用，因为我们有自定义的 callback 路由
  token: {
    url: "",
    async request() {
      return { tokens: {} }
    },
  },
  userinfo: {
    url: "",
    async request() {
      return {}
    },
  },
  profile(profile: any) {
    return {
      id: profile.steamid || profile.sub,
      name: profile.personaname || profile.name,
      image: profile.avatarfull || profile.picture,
      steamId: profile.steamid,
    }
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    SteamProvider as any,
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 当首次登录时，account 和 profile 会被提供
      if (account && profile) {
        // Steam OpenID 返回的信息在 profile 中
        if (account.provider === "steam") {
          // 从 openid 响应中提取 steamid
          // Steam OpenID 会在 return_to URL 中添加查询参数
          const steamId = profile.steamid || (profile as any).sub
          const name = profile.personaname || profile.name
          const picture = profile.avatarfull || profile.picture
          
          if (steamId && typeof steamId === 'string') {
            token.steamId = steamId
          }
          if (name && typeof name === 'string') {
            token.name = name
          }
          if (picture && typeof picture === 'string') {
            token.picture = picture
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub
        if (token.steamId) {
          (session.user as any).steamId = token.steamId
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
