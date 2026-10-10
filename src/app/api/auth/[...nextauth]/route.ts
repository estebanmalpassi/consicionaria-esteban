import type { NextRequest } from "next/server";

import { auth, handlers } from "@/lib/auth";
import { sinVencimiento } from "@/lib/sesion-temporal";

// Al entrar con "es mi celular o mi compu" sin marcar, y cada vez que se renueva
// esa sesión, la cookie sale sin vencimiento: se borra al cerrar el navegador.

export async function GET(req: NextRequest) {
  const res = await handlers.GET(req);
  const sesion = await auth();
  return sesion?.user && !sesion.user.confianza ? sinVencimiento(res) : res;
}

export async function POST(req: NextRequest) {
  const ingreso = req.nextUrl.pathname.endsWith("/callback/credentials");
  const confianza = ingreso ? (await req.clone().formData()).get("confianza") === "1" : (await auth())?.user?.confianza;
  const res = await handlers.POST(req);
  return confianza === false ? sinVencimiento(res) : res;
}
