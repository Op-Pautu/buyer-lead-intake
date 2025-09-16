import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'demo-login',
      name: 'Demo Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'Enter any email' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // Check if user exists
        let user = await db.query.users.findFirst({
          where: eq(schema.users.email, credentials.email),
        })

        // Create user if doesn't exist (demo mode)
        if (!user) {
          [user] = await db.insert(schema.users).values({
            email: credentials.email,
            name: credentials.email.split('@')[0],
          }).returning()
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
}
