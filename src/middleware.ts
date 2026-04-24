import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico
     * - /auth/* (login, register pages)
     * - /api/auth/* (NextAuth + public register endpoint)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/|api/auth/).*)",
  ],
};
