import NextAuth, { NextAuthResult } from "next-auth"
import { authConfig } from "@/auth.config"

const auth: NextAuthResult["auth"] = NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

export default auth