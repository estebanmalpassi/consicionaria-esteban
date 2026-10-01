"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { codigoInvitacionValido, getAgencia } from "@/lib/dealer";

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

  const { name, email, password, codigo } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Solo la gente de la agencia puede crear cuenta: hace falta el código de invitación.
  if (!process.env.CODIGO_INVITACION?.trim()) {
    return { ok: false, error: "El registro está cerrado. Pedile acceso a la agencia." };
  }
  if (!codigoInvitacionValido(codigo)) {
    return { ok: false, error: "El código de invitación no es correcto." };
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { ok: false, error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // La primera cuenta es la dueña y después carga los datos de la agencia;
  // las siguientes entran como empleados de esa misma agencia.
  const agencia = await getAgencia();
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: agencia ? "DEALER_STAFF" : "DEALER_OWNER",
      dealershipId: agencia?.id ?? null,
    },
  });
  if (agencia) {
    await prisma.auditLog.create({
      data: { actorUserId: user.id, dealershipId: agencia.id, action: "user.joined", entityType: "User", entityId: user.id },
    });
  }

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
    redirectTo: agencia ? "/dealer" : "/dealer/onboarding",
  };
}
