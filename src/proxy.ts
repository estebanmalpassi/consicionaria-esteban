import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { MARCA_SESION_TEMPORAL, sinVencimiento } from "@/lib/sesion-temporal";

const conSesion = auth((req) => {
  const isDealerRoute = req.nextUrl.pathname.startsWith("/dealer");
  if (!isDealerRoute) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = ["DEALER_OWNER", "DEALER_STAFF"];
  if (!allowedRoles.includes(req.auth.user.role)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const res = NextResponse.next();
  if (!req.auth.user.confianza) res.headers.set(MARCA_SESION_TEMPORAL, "1");
  return res;
});

export default async function proxy(req: NextRequest, ev: NextFetchEvent) {
  const res = await conSesion(req, ev as never);
  if (!res?.headers.has(MARCA_SESION_TEMPORAL)) return res;
  res.headers.delete(MARCA_SESION_TEMPORAL);
  return sinVencimiento(res);
}

export const config = {
  matcher: ["/dealer/:path*"],
};
