import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"

// Steam OpenID 2.0 自定义配置
const SteamProvider = {
  id: "steam",
  name: "Steam",
  type: "oidc" as const,
  issuer: "https://steamcommunity.com/openid",
  authorization: {
    url: "https://steamcommunity.com/openid/login",
    params: {
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.mode": "checkid_setup",
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.realm": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "openid.return_to": `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/steam`,
    },
  },
  profile(profile: any) {
    return {
      id: profile.steamid,
      name: profile.personaname,
      image: profile.avatarfull,
      steamId: profile.steamid,
    }
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    SteamProvider as any,
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
