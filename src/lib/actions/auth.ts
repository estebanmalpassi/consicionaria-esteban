"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { codigoDuenoValido, codigoDuenoYaUsado, codigoInvitacionValido, getAgencia } from "@/lib/dealer";

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

  // Solo la gente de la agencia puede crear cuenta. Hay dos códigos:
  // - CODIGO_DUENO (un solo uso): quien lo usa queda como dueño de la agencia.
  // - CODIGO_INVITACION: empleados.
  if (!process.env.CODIGO_INVITACION?.trim() && !process.env.CODIGO_DUENO?.trim()) {
    return { ok: false, error: "El registro está cerrado. Pedile acceso a la agencia." };
  }
  const esDueno = codigoDuenoValido(codigo);
  if (esDueno && (await codigoDuenoYaUsado())) {
    return { ok: false, error: "Ese código de dueño ya fue usado. Pedile un código de invitación a la agencia." };
  }
  if (!esDueno && !codigoInvitacionValido(codigo)) {
    return { ok: false, error: "El código no es correcto." };
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { ok: false, error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Sin agencia todavía: la primera cuenta es la dueña y después carga los datos.
  // Con agencia: el código de dueño le pasa el control (el dueño anterior queda
  // como empleado); el de invitación entra como empleado.
  const agencia = await getAgencia();
  await prisma.$transaction(async (tx) => {
    const nuevo = await tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: !agencia || esDueno ? "DEALER_OWNER" : "DEALER_STAFF",
        dealershipId: agencia?.id ?? null,
      },
    });
    if (agencia && esDueno) {
      await tx.user.update({ where: { id: agencia.ownerId }, data: { role: "DEALER_STAFF", dealershipId: agencia.id } });
      await tx.dealership.update({ where: { id: agencia.id }, data: { ownerId: nuevo.id } });
    }
    if (esDueno) {
      await tx.auditLog.create({
        data: {
          actorUserId: nuevo.id,
          dealershipId: agencia?.id ?? null,
          action: "dealership.owner_claimed",
          entityType: "User",
          entityId: nuevo.id,
          metadata: agencia ? { dueñoAnterior: agencia.ownerId } : undefined,
        },
      });
    } else if (agencia) {
      await tx.auditLog.create({
        data: { actorUserId: nuevo.id, dealershipId: agencia.id, action: "user.joined", entityType: "User", entityId: nuevo.id },
      });
    }
  });

  try {
    await signIn("credentials", { email: normalizedEmail, password, confianza: "1", redirect: false });
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
