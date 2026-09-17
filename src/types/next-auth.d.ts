import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    dealershipId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      dealershipId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    dealershipId: string | null;
  }
}
