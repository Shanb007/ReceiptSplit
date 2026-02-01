import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { isLocalMode } from './mode'

const LOCAL_USER_EMAIL = 'local@receiptsplit.local'

function buildLocalAuthOptions(): NextAuthOptions {
  return {
    providers: [
      CredentialsProvider({
        name: 'Local',
        credentials: {},
        async authorize() {
          const user = await prisma.user.upsert({
            where: { email: LOCAL_USER_EMAIL },
            update: {},
            create: {
              email: LOCAL_USER_EMAIL,
              name: 'You',
            },
          })
          return { id: user.id, name: user.name, email: user.email }
        },
      }),
    ],
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      jwt: async ({ token, user }) => {
        if (user) {
          token.sub = user.id
        }
        return token
      },
      session: async ({ session, token }) => {
        if (session.user && token.sub) {
          session.user.id = token.sub
          session.user.name = token.name ?? 'You'
          session.user.email = token.email ?? LOCAL_USER_EMAIL
        }
        return session
      },
    },
    pages: {
      signIn: '/login',
    },
  }
}

function buildCloudAuthOptions(): NextAuthOptions {
  return {
    adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    callbacks: {
      session: async ({ session, user }) => {
        if (session.user) {
          session.user.id = user.id
        }
        return session
      },
    },
    pages: {
      signIn: '/login',
    },
  }
}

export const authOptions: NextAuthOptions = isLocalMode
  ? buildLocalAuthOptions()
  : buildCloudAuthOptions()
