import type { NextAuthConfig } from "next-auth";
import type { AuthUser } from "@/types/auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  providers: [],

  callbacks: {
    authorized({ auth, request: { nextUrl, method } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/auth");
      const isPublicApi =
        (nextUrl.pathname === "/api/products" && method === "GET") ||
        (nextUrl.pathname.startsWith("/api/products/") && method === "GET") ||
        nextUrl.pathname === "/api/categories";

      if (isPublicApi) return true;

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/catalog", nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/auth/login", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as AuthUser;
        token.id = u.id;
        token.role = u.role;
        token.company = u.company;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.company = token.company as string;
      return session;
    },
  },
};
