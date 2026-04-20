import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"

// 注意: Steam provider 需要在 route handler 中动态添加(因为它需要 request 对象)
// 这里的配置仅用于 auth()、signIn()、signOut() 等辅助函数
export const { auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "database" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
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
