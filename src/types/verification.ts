export type VerificationDocType =
  | "FORMULARIO_08"
  | "TITULO_PROPIEDAD"
  | "TARJETA_VERDE"
  | "LIBRE_DEUDA"
  | "INFORME_DOMINIO";

export type VerificationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "VERIFIED"
  | "FAILED"
  | "EXPIRED";

export interface VehicleVerificationItem {
  docType: VerificationDocType;
  status: VerificationStatus;
  provider?: string;
  verifiedAt?: string | null;
  expiresAt?: string | null;
}

export const VERIFICATION_DOC_LABELS: Record<VerificationDocType, string> = {
  FORMULARIO_08: "Formulario 08",
  TITULO_PROPIEDAD: "Título de Propiedad",
  TARJETA_VERDE: "Tarjeta Verde",
  LIBRE_DEUDA: "Libre de Deuda",
  INFORME_DOMINIO: "Informe de Dominio",
};

export const VERIFICATION_DOC_DESCRIPTIONS: Record<VerificationDocType, string> = {
  FORMULARIO_08: "Formulario de transferencia firmado y listo para trámite.",
  TITULO_PROPIEDAD: "Título de propiedad automotor vigente y sin observaciones.",
  TARJETA_VERDE: "Cédula del automotor (tarjeta verde) al día.",
  LIBRE_DEUDA: "Sin infracciones ni patentes impagas registradas.",
  INFORME_DOMINIO: "Informe de dominio sin gravámenes, prendas ni embargos.",
};

export const REQUIRED_VERIFICATION_DOCS: VerificationDocType[] = [
  "FORMULARIO_08",
  "TITULO_PROPIEDAD",
  "TARJETA_VERDE",
  "LIBRE_DEUDA",
  "INFORME_DOMINIO",
];

export function isFullyVerified(items: VehicleVerificationItem[]) {
  return REQUIRED_VERIFICATION_DOCS.every(
    (doc) => items.find((i) => i.docType === doc)?.status === "VERIFIED"
  );
}

export function verificationProgress(items: VehicleVerificationItem[]) {
  const verified = REQUIRED_VERIFICATION_DOCS.filter(
    (doc) => items.find((i) => i.docType === doc)?.status === "VERIFIED"
  ).length;
  return Math.round((verified / REQUIRED_VERIFICATION_DOCS.length) * 100);
}
