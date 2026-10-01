import { prisma } from "@/lib/prisma";

/** Sirve una foto guardada en la base. El id es inmutable, así que se cachea fuerte. */
export async function GET(_request: Request, ctx: RouteContext<"/api/fotos/[id]">) {
  const { id } = await ctx.params;
  const photo = await prisma.vehiclePhoto.findUnique({
    where: { id },
    select: { data: true, mimeType: true, url: true },
  });
  if (!photo) return new Response("Not found", { status: 404 });
  if (!photo.data) {
    return photo.url ? Response.redirect(photo.url, 302) : new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
