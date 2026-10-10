import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

/**
 * En una compu ajena (sin marcar "es mi celular o mi compu") la sesión se corta
 * si pasa este tiempo sin usarse, aunque el navegador quede abierto.
 */
const INACTIVIDAD_MAXIMA_MS = 2 * 60 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        confianza: {},
      },
      authorize: async (rawCredentials) => {
        const parsed = loginSchema.safeParse({ email: rawCredentials.email, password: rawCredentials.password });
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          dealershipId: user.dealershipId,
          confianza: rawCredentials.confianza === "1",
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      const ahora = Date.now();
      if (user) {
        token.role = user.role;
        token.dealershipId = user.dealershipId;
        token.confianza = user.confianza ?? true;
        token.ultimoUso = ahora;
      }
      if (token.confianza === false) {
        // Devolver null borra la sesión.
        if (ahora - Number(token.ultimoUso ?? 0) > INACTIVIDAD_MAXIMA_MS) return null;
        token.ultimoUso = ahora;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.dealershipId = token.dealershipId as string | null;
        session.user.confianza = token.confianza !== false;
      }
      return session;
    },
  },
});
