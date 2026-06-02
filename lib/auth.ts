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

      // Get the GitHub login (username) from the Account table
      // providerAccountId for GitHub = numeric user ID, not what we want
      // Instead fetch the profile data stored during sign in
      const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: 'github' },
        select: { access_token: true },
      })

      if (account?.access_token) {
        // Fetch the GitHub login directly from GitHub API
        const response = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${account.access_token}` },
        })
        const githubUser = await response.json()
        session.user.username = githubUser.login // "GuptaAkshat23"
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