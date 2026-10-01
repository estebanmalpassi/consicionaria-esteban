export type FuelType = "NAFTA" | "DIESEL" | "GNC" | "HIBRIDO" | "ELECTRICO";
export type TransmissionType = "MANUAL" | "AUTOMATICA";
export const FUEL_LABELS: Record<FuelType, string> = {
  NAFTA: "Nafta",
  DIESEL: "Diésel",
  GNC: "GNC",
  HIBRIDO: "Híbrido",
  ELECTRICO: "Eléctrico",
};

export const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  MANUAL: "Manual",
  AUTOMATICA: "Automática",
};
