import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Steam from "next-auth-steam"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import type { NextRequest } from "next/server"

const { handlers } = NextAuth((req: NextRequest | undefined) => {
  return {
    adapter: DrizzleAdapter(db),
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    session: { strategy: "database" },
    providers: [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      }),
      ...(req ? [Steam(req, {
        apiKey: process.env.AUTH_STEAM_ID!,
      })] : []),
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
  }
})

export const { GET, POST } = handlers
