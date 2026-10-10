/**
 * Sesiones de compus ajenas: la cookie de sesión va sin fecha de vencimiento,
 * así el navegador la borra al cerrarse. Auth.js siempre le pone vencimiento
 * (30 días), así que se le saca en las respuestas que la escriben: el proxy de
 * /dealer y las rutas de /api/auth.
 */

const COOKIE_SESION = /^(__Secure-)?authjs\.session-token(\.\d+)?=/;

/** Encabezado interno con el que el proxy avisa que la sesión es de una compu ajena. */
export const MARCA_SESION_TEMPORAL = "x-cartuccia-sesion-temporal";

function esBorrado(cookie: string) {
  return /^[^=]+=;/.test(cookie) || /Max-Age=0\b/i.test(cookie) || /Expires=Thu, 01 Jan 1970/i.test(cookie);
}

/** Devuelve la misma respuesta con la cookie de sesión convertida en cookie "hasta cerrar el navegador". */
export function sinVencimiento(res: Response): Response {
  const cookies = res.headers.getSetCookie();
  if (!cookies.some((c) => COOKIE_SESION.test(c) && !esBorrado(c))) return res;
  const headers = new Headers(res.headers);
  headers.delete("set-cookie");
  for (const c of cookies) {
    headers.append("set-cookie", COOKIE_SESION.test(c) && !esBorrado(c) ? c.replace(/;\s*(Expires|Max-Age)=[^;]*/gi, "") : c);
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
