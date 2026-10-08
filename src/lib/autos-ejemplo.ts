import type { AutoCarrusel } from "@/components/inicio/carrusel-autos";

/**
 * Autos de muestra para ver cómo queda el carrusel antes de cargar stock real.
 * Solo se muestran con `/?muestra=1`: los clientes nunca ven autos inventados.
 */
export const AUTOS_EJEMPLO: Omit<AutoCarrusel, "whatsapp">[] = [
  { id: "ej-hilux", titulo: "Toyota Hilux", detalle: "SRV 4x4 · 2021 · 68.000 km · Diésel", etiqueta: "Pick-up", foto: null },
  { id: "ej-cronos", titulo: "Fiat Cronos", detalle: "Drive 1.3 · 2022 · 41.000 km · Nafta", etiqueta: "Sedán", foto: null },
  { id: "ej-amarok", titulo: "Volkswagen Amarok", detalle: "Highline V6 · 2020 · 92.000 km · Diésel", etiqueta: "Pick-up", foto: null },
  { id: "ej-onix", titulo: "Chevrolet Onix", detalle: "LT 1.0 Turbo · 2023 · 18.000 km · Nafta", etiqueta: "Hatchback", foto: null },
  { id: "ej-208", titulo: "Peugeot 208", detalle: "Allure 1.6 · 2022 · 35.000 km · Nafta", etiqueta: "Hatchback", foto: null },
  { id: "ej-ranger", titulo: "Ford Ranger", detalle: "XLT 3.2 · 2021 · 77.000 km · Diésel", etiqueta: "Pick-up", foto: null },
  { id: "ej-kangoo", titulo: "Renault Kangoo", detalle: "Stepway 1.6 · 2019 · 110.000 km · Nafta", etiqueta: "Utilitario", foto: null },
  { id: "ej-etios", titulo: "Toyota Etios", detalle: "XLS 1.5 · 2020 · 64.000 km · Nafta", etiqueta: "Sedán", foto: null },
];
