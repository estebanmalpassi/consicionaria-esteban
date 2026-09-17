import type { VehicleSummary } from "@/types/vehicle";

/** Inline SVG placeholder so the demo has no external image dependency. */
function placeholderPhoto(label: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}" />
        <stop offset="1" stop-color="${to}" />
      </linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#g)" />
    <text x="50%" y="50%" font-family="sans-serif" font-size="44" font-weight="700"
      fill="white" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MOCK_VEHICLES: VehicleSummary[] = [
  {
    id: "veh_1",
    patente: "AC123BD",
    brand: "Volkswagen",
    model: "Taos",
    version: "Highline 250 TSI",
    year: 2023,
    mileageKm: 18500,
    priceArs: 32500000,
    fuelType: "NAFTA",
    transmission: "AUTOMATICA",
    city: "Córdoba",
    province: "Córdoba",
    status: "PUBLISHED",
    coverPhotoUrl: placeholderPhoto("Volkswagen Taos", "#1e3a8a", "#3b82f6"),
    dealershipName: "Concesionaria Esteban",
    verifications: [
      { docType: "FORMULARIO_08", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TITULO_PROPIEDAD", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TARJETA_VERDE", status: "VERIFIED", provider: "DNRPA" },
      { docType: "LIBRE_DEUDA", status: "VERIFIED", provider: "Rentas Córdoba" },
      { docType: "INFORME_DOMINIO", status: "VERIFIED", provider: "DNRPA" },
    ],
  },
  {
    id: "veh_2",
    patente: "AE456FG",
    brand: "Toyota",
    model: "Corolla Cross",
    version: "XEI CVT",
    year: 2022,
    mileageKm: 34200,
    priceArs: 27800000,
    fuelType: "HIBRIDO",
    transmission: "AUTOMATICA",
    city: "Rosario",
    province: "Santa Fe",
    status: "PUBLISHED",
    coverPhotoUrl: placeholderPhoto("Toyota Corolla Cross", "#7c2d12", "#f97316"),
    dealershipName: "AutoPremium SA",
    verifications: [
      { docType: "FORMULARIO_08", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TITULO_PROPIEDAD", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TARJETA_VERDE", status: "IN_PROGRESS", provider: "DNRPA" },
      { docType: "LIBRE_DEUDA", status: "PENDING" },
      { docType: "INFORME_DOMINIO", status: "PENDING" },
    ],
  },
  {
    id: "veh_3",
    patente: "AF789JK",
    brand: "Ford",
    model: "Ranger",
    version: "Limited 3.0 4x4",
    year: 2021,
    mileageKm: 62000,
    priceArs: 41200000,
    fuelType: "DIESEL",
    transmission: "AUTOMATICA",
    city: "Mendoza",
    province: "Mendoza",
    status: "PUBLISHED",
    coverPhotoUrl: placeholderPhoto("Ford Ranger", "#14532d", "#22c55e"),
    dealershipName: "Cuyo Motors",
    verifications: [
      { docType: "FORMULARIO_08", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TITULO_PROPIEDAD", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TARJETA_VERDE", status: "VERIFIED", provider: "DNRPA" },
      { docType: "LIBRE_DEUDA", status: "FAILED", provider: "Rentas Mendoza" },
      { docType: "INFORME_DOMINIO", status: "VERIFIED", provider: "DNRPA" },
    ],
  },
  {
    id: "veh_4",
    patente: "AG321LM",
    brand: "Fiat",
    model: "Cronos",
    version: "Drive 1.3",
    year: 2024,
    mileageKm: 5400,
    priceArs: 19900000,
    fuelType: "NAFTA",
    transmission: "MANUAL",
    city: "La Plata",
    province: "Buenos Aires",
    status: "PUBLISHED",
    coverPhotoUrl: placeholderPhoto("Fiat Cronos", "#581c87", "#a855f7"),
    dealershipName: "Concesionaria Esteban",
    verifications: [
      { docType: "FORMULARIO_08", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TITULO_PROPIEDAD", status: "VERIFIED", provider: "DNRPA" },
      { docType: "TARJETA_VERDE", status: "VERIFIED", provider: "DNRPA" },
      { docType: "LIBRE_DEUDA", status: "VERIFIED", provider: "ARBA" },
      { docType: "INFORME_DOMINIO", status: "VERIFIED", provider: "DNRPA" },
    ],
  },
];
