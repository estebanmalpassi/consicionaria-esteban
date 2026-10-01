import { MARCA } from "@/lib/marca";

/**
 * Manifest del panel, para instalarlo en el celular ("Agregar a la pantalla
 * principal"): se abre a pantalla completa, directo en el panel. Solo lo
 * enlazan las páginas de /dealer, así un cliente que guarda la portada en su
 * celular sigue llegando a la portada y no al acceso del equipo.
 */
export function GET() {
  return Response.json(
    {
      name: MARCA.nombre,
      short_name: MARCA.nombreCorto,
      description: "Panel de ventas de la agencia: stock, boletos y recibos.",
      id: "/dealer",
      start_url: "/dealer",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0b1520",
      theme_color: "#0b1520",
      lang: "es-AR",
      icons: [
        { src: "/marca/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/marca/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/marca/app-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
