import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    dealershipId: string | null;
    /** Marcó "es mi celular o mi compu" al entrar. */
    confianza?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      dealershipId: string | null;
      /** false = compu ajena: la sesión se borra al cerrar el navegador. */
      confianza: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    dealershipId: string | null;
    /** Las sesiones de antes de esta opción no lo tienen y se toman como de confianza. */
    confianza?: boolean;
    /** Último uso (ms), para cortar las sesiones de compus ajenas que quedan abiertas. */
    ultimoUso?: number;
  }
}
