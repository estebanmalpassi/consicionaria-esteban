/** Tipos de gasto que se le pueden cargar a un auto (uso interno de la agencia). */
export const CATEGORIAS_GASTO = [
  "Mecánica",
  "Chapa y pintura",
  "Cubiertas",
  "Lavado y detalle",
  "Gestoría / VTV",
  "Otro",
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

/**
 * Ganancia real de un auto: precio de venta menos lo que pagó la agencia y los
 * gastos. El porcentaje es sobre el precio de venta. Sin precio de compra
 * cargado no se puede calcular.
 */
export function resultadoAuto(precioVenta: number, precioCompra: number | null, totalGastos: number) {
  if (precioCompra === null) return null;
  const invertido = precioCompra + totalGastos;
  const ganancia = precioVenta - invertido;
  const porcentaje = precioVenta > 0 ? (ganancia / precioVenta) * 100 : 0;
  const nivel: "bueno" | "bajo" | "perdida" = ganancia < 0 ? "perdida" : porcentaje < 10 ? "bajo" : "bueno";
  return { invertido, ganancia, porcentaje, nivel };
}
