import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Get username from Account table via providerAccountId
        // GitHub's providerAccountId is the numeric user ID
        // We get the login from the stored profile data
        const account = await prisma.account.findFirst({
          where: { userId: user.id, provider: 'github' },
          select: { access_token: true },
        })
        if (account?.access_token) {
          const res = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${account.access_token}` },
            next: { revalidate: 3600 }, // cache for 1 hour
          })
          if (res.ok) {
            const githubUser = await res.json()
            session.user.username = githubUser.login
            // Also update username in DB for future use
            await prisma.user.update({
              where: { id: user.id },
              data: { username: githubUser.login, name: githubUser.name, image: githubUser.avatar_url },
            })
          }
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}