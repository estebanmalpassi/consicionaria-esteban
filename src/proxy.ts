import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export default auth((req) => {
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/dealer/:path*"],
};
