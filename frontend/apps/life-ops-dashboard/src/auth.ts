import NextAuth, { NextAuthResult } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "@/auth.config"

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize(creds) {
        const email = String(creds?.email ?? "")
        const password = String(creds?.password ?? "")
        const okEmail = email === process.env.AUTH_EMAIL
        const okPass =
          !!process.env.AUTH_PASSWORD_HASH_B64 &&
          bcrypt.compareSync(password, Buffer.from(process.env.AUTH_PASSWORD_HASH_B64, "base64").toString())
        return okEmail && okPass ? { id: "1", email } : null
      },
    }),
  ],
})


export const handlers: NextAuthResult["handlers"] = nextAuth.handlers
export const auth: NextAuthResult["auth"] = nextAuth.auth
export const signIn: NextAuthResult["signIn"] = nextAuth.signIn
export const signOut: NextAuthResult["signOut"] = nextAuth.signOut