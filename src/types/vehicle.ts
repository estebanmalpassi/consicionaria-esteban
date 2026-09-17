import type { VehicleVerificationItem } from "./verification";

export type FuelType = "NAFTA" | "DIESEL" | "GNC" | "HIBRIDO" | "ELECTRICO";
export type TransmissionType = "MANUAL" | "AUTOMATICA";
export type VehicleStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "PUBLISHED"
  | "PAUSED"
  | "SOLD"
  | "REJECTED";

export interface VehicleSummary {
  id: string;
  patente: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  mileageKm: number;
  priceArs: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  city?: string;
  province?: string;
  status: VehicleStatus;
  coverPhotoUrl: string;
  photos?: string[];
  dealershipName: string;
  verifications: VehicleVerificationItem[];
}

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
