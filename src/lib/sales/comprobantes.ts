/**
 * Reglas de negocio para los papeles y trámites de una venta de automotor en
 * Argentina. Son funciones puras (sin Prisma) para poder usarlas tanto en el
 * servidor como en el wizard del navegador.
 */

export type CondicionIva = "CONSUMIDOR_FINAL" | "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTO" | "EXENTO";
/** "N° 000042" */
export function numeroRecibo(numero: number) {
  return `N° ${String(numero).padStart(6, "0")}`;
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
  { id: "boleto", titulo: "Boleto de compraventa", descripcion: "Con el mismo formato y cláusulas del boleto de la agencia." },
  { id: "recibo", titulo: "Recibo", descripcion: "Con el membrete de la agencia y el monto en letras." },
  { id: "f08", titulo: "Datos para el Formulario 08", descripcion: "Hoja con todo lo que pide el 08, lista para pasar." },
  { id: "entrega", titulo: "Acta de entrega", descripcion: "Km, estado y conformidad del cliente." },
] as const;

export type DocumentoId = (typeof DOCUMENTOS)[number]["id"];
