"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";

export interface RegisterActionResult {
  ok: boolean;
  error?: string;
  redirectTo?: string;
}

export async function registerAction(
  raw: unknown
): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { name, email, password, accountType } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { ok: false, error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Dealership creation is deferred to the onboarding wizard, which is the
  // first place we actually know the CUIT (a required, unique field). A
  // DEALER_OWNER can exist with `dealershipId: null` in between.
  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: accountType,
    },
  });

  try {
    await signIn("credentials", { email: normalizedEmail, password, redirect: false });
  } catch {
    return {
      ok: true,
      redirectTo: "/login",
    };
  }

  return {
    ok: true,
    redirectTo: accountType === "DEALER_OWNER" ? "/dealer/onboarding" : "/",
  };
}
