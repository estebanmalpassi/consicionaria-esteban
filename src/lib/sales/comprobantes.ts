/**
 * Reglas de negocio para comprobantes y trámites de una venta de automotor en
 * Argentina. Son funciones puras (sin Prisma) para poder usarlas tanto en el
 * servidor como en el wizard del navegador.
 */

export type CondicionIva = "CONSUMIDOR_FINAL" | "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTO" | "EXENTO";
export type TipoFactura = "FACTURA_A" | "FACTURA_B" | "FACTURA_C";

export const CONDICION_IVA_LABELS: Record<CondicionIva, string> = {
  CONSUMIDOR_FINAL: "Consumidor Final",
  RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
  MONOTRIBUTO: "Monotributista",
  EXENTO: "IVA Exento",
};

export const TIPO_FACTURA_LETRA: Record<TipoFactura, "A" | "B" | "C"> = {
  FACTURA_A: "A",
  FACTURA_B: "B",
  FACTURA_C: "C",
};

/** Código AFIP del comprobante (se imprime debajo de la letra). */
export const TIPO_FACTURA_CODIGO: Record<TipoFactura, string> = {
  FACTURA_A: "01",
  FACTURA_B: "06",
  FACTURA_C: "11",
};

/**
 * Elige la letra de la factura según quién vende y quién compra:
 * - Vendedor Monotributo o Exento → siempre C.
 * - Vendedor Responsable Inscripto → A si el comprador es RI, B en el resto de los casos.
 */
export function tipoDeFactura(vendedor: string | null | undefined, comprador: CondicionIva): TipoFactura {
  if (vendedor !== "RESPONSABLE_INSCRIPTO") return "FACTURA_C";
  return comprador === "RESPONSABLE_INSCRIPTO" ? "FACTURA_A" : "FACTURA_B";
}

/** Separa neto e IVA de un precio final que ya incluye IVA. */
export function desglosarIva(totalConIva: number, alicuota: number) {
  if (!alicuota) return { neto: totalConIva, iva: 0 };
  const neto = Math.round((totalConIva / (1 + alicuota / 100)) * 100) / 100;
  return { neto, iva: Math.round((totalConIva - neto) * 100) / 100 };
}

/** 0001-00000042 */
export function numeroComprobante(puntoDeVenta: number, numero: number | null | undefined) {
  const pv = String(puntoDeVenta).padStart(4, "0");
  return numero ? `${pv}-${String(numero).padStart(8, "0")}` : `${pv}-________`;
}

export const FORMA_PAGO_LABELS = {
  CONTADO: "Contado (efectivo)",
  TRANSFERENCIA: "Transferencia bancaria",
  FINANCIADO: "Financiado / prendario",
  PERMUTA: "Permuta + diferencia",
  MIXTO: "Pago mixto",
} as const;

export const ESTADO_VENTA_LABELS = {
  RESERVADA: "Reservada con seña",
  VENDIDA: "Vendida · falta entregar",
  ENTREGADA: "Entregada",
  ANULADA: "Anulada",
} as const;

/**
 * Pasos de la transferencia. Es la "carpeta" que el administrador va tildando;
 * el orden sigue el recorrido habitual en el Registro Automotor.
 */
export const PASOS_TRAMITE = [
  { id: "sena", titulo: "Seña / reserva firmada", detalle: "Recibo de seña entregado al cliente." },
  { id: "boleto", titulo: "Boleto de compraventa firmado", detalle: "Dos copias, una para cada parte." },
  { id: "pago", titulo: "Pago total recibido", detalle: "Efectivo, transferencia acreditada o crédito aprobado." },
  { id: "factura", titulo: "Factura emitida con CAE", detalle: "Cargá el número y el CAE que te da ARCA/AFIP." },
  { id: "informe", titulo: "Informe de dominio", detalle: "Sin embargos, prendas ni inhibiciones." },
  { id: "libre_deuda", titulo: "Libre deuda de patentes e infracciones", detalle: "Rentas provincial / municipal." },
  { id: "verificacion", titulo: "Verificación policial (planta)", detalle: "Formulario 12 vigente." },
  { id: "f08", titulo: "Formulario 08 firmado y certificado", detalle: "Firmas certificadas por escribano o Registro." },
  { id: "registro", titulo: "Presentado en el Registro Automotor", detalle: "Turno y aranceles pagos." },
  { id: "titulo", titulo: "Título y cédula nuevos recibidos", detalle: "A nombre del comprador." },
  { id: "entrega", titulo: "Auto entregado", detalle: "Acta de entrega firmada con km y estado." },
] as const;

export type PasoTramiteId = (typeof PASOS_TRAMITE)[number]["id"];

export function progresoTramite(checklist: unknown) {
  const map = (checklist ?? {}) as Record<string, boolean>;
  const hechos = PASOS_TRAMITE.filter((p) => map[p.id]).length;
  return { hechos, total: PASOS_TRAMITE.length, porcentaje: Math.round((hechos / PASOS_TRAMITE.length) * 100) };
}

/** Documentos que la app genera listos para imprimir. */
export const DOCUMENTOS = [
  { id: "boleto", titulo: "Boleto de compraventa", descripcion: "Contrato entre la concesionaria y el comprador." },
  { id: "recibo", titulo: "Recibo de pago / seña", descripcion: "Con el monto escrito en letras." },
  { id: "factura", titulo: "Factura", descripcion: "Letra A, B o C elegida automáticamente." },
  { id: "f08", titulo: "Datos para el Formulario 08", descripcion: "Hoja con todo lo que pide el 08, lista para pasar." },
  { id: "entrega", titulo: "Acta de entrega", descripcion: "Km, estado y conformidad del cliente." },
] as const;

export type DocumentoId = (typeof DOCUMENTOS)[number]["id"];
