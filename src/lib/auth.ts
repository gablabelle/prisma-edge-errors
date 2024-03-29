import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { type PrismaClient, db } from "@/lib/db";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(db as unknown as PrismaClient),
  session: { strategy: "database" }, // switch the strategy to "jwt" to avoid RSC throwing 500s
  secret: process.env.AUTH_SECRET,
  providers: [GithubProvider],
  callbacks: {
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user?.id;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image,
      };
    },
    redirect() {
      return "/";
    },
    authorized({ auth }) {
      return !!auth?.user; // this ensures there is a logged in user for -every- request
    },
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        secure: true,
        httpOnly: true,
        path: "/",
        partitioned: true,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        secure: true,
        httpOnly: true,
        path: "/",
        partitioned: true,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        secure: true,
        httpOnly: true,
        path: "/",
        partitioned: true,
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        secure: true,
        httpOnly: true,
        path: "/",
        partitioned: true,
      },
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  // CSRF_experimental, // will be removed in future
} = NextAuth(authOptions);
