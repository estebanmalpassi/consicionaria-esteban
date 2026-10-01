/** URL pública de una foto (guardada en la base o externa). */
export function fotoUrl(photo: { id: string; url: string | null }) {
  return photo.url ?? `/api/fotos/${photo.id}`;
}

/** Campos a pedir a Prisma para listar fotos sin traer los bytes. */
export const FOTO_SELECT = { id: true, url: true, label: true, isCover: true, order: true } as const;

/**
 * Guía de fotos: el administrador ve qué tomas faltan, como un "shot list"
 * de estudio. Así todos los autos se publican con fotos parejas.
 */
export const TOMAS_SUGERIDAS = [
  "Frente 3/4",
  "Lateral",
  "Trasera",
  "Interior",
  "Tablero / km",
  "Motor",
] as const;
