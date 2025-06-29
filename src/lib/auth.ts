import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ROLE_PERMISSIONS } from "@/lib/permissions"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            showroom: true
          }
        })

        if (!user || !user.isActive || user.deletedAt) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        // TODO: Log the login activity when AuditLog model is available
        // await prisma.auditLog.create({
        //   data: {
        //     action: "USER_LOGIN",
        //     entityType: "User",
        //     entityId: user.id,
        //     userId: user.id,
        //     metadata: {
        //       email: user.email,
        //       role: user.role
        //     }
        //   }
        // })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          showroomId: user.showroomId,
          showroom: user.showroom,
          avatar: user.avatar,
          permissions: JSON.parse(user.permissions || "{}"),
          twoFactorEnabled: user.twoFactorEnabled
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.showroomId = user.showroomId
        token.showroom = user.showroom
        token.permissions = user.permissions
        token.twoFactorEnabled = user.twoFactorEnabled
        token.dashboardUrl = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS]?.dashboardUrl || "/dashboard"
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.showroomId = token.showroomId as string
        session.user.showroom = token.showroom as any
        session.user.permissions = token.permissions as any
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.dashboardUrl = token.dashboardUrl as string
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        // Log the logout activity
        await prisma.auditLog.create({
          data: {
            action: "USER_LOGOUT",
            entityType: "User",
            entityId: token.sub,
            userId: token.sub,
            metadata: {
              email: token.email
            }
          }
        }).catch(console.error)
      }
    },
    async session({ session, token }) {
      // Update user activity timestamp
      if (token?.sub) {
        await prisma.user.update({
          where: { id: token.sub },
          data: { lastLogin: new Date() }
        }).catch(console.error)
      }
    }
  },
  debug: process.env.NODE_ENV === "development",
}
