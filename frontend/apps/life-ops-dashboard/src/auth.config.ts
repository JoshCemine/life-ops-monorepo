import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
     authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user
      const onLogin = nextUrl.pathname === "/login"
      if (onLogin) {
        return loggedIn
          ? Response.redirect(new URL("/dashboard", nextUrl))
          : true
      }
      return loggedIn
    },
  },
  providers: [],
} satisfies NextAuthConfig