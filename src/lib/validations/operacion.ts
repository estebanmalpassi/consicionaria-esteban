import { z } from "zod";

const opcional = z.string().trim().optional().or(z.literal(""));
const montoPositivo = z.coerce.number({ message: "Ingresá un monto." }).positive("El monto tiene que ser mayor a cero.");
const montoOpcional = z.coerce.number().min(0).optional();

export const personaSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresá nombre y apellido."),
  docType: z.enum(["DNI", "CUIT", "CUIL", "Pasaporte"]).default("DNI"),
  docNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[.\s-]/g, ""))
    .pipe(z.string().min(6, "Revisá el número de documento.")),
  ivaCondition: z.enum(["CONSUMIDOR_FINAL", "RESPONSABLE_INSCRIPTO", "MONOTRIBUTO", "EXENTO"]).default("CONSUMIDOR_FINAL"),
  nationality: opcional,
  maritalStatus: opcional,
  birthDate: opcional,
  occupation: opcional,
  address: z.string().trim().min(3, "Ingresá el domicilio."),
  city: opcional,
  province: opcional,
  postalCode: opcional,
  phone: opcional,
  email: z.string().trim().email("Email inválido.").optional().or(z.literal("")),
});
export type PersonaValues = z.input<typeof personaSchema>;

export const vehiculoSchema = z.object({
  patente: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase().replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2}|[A-Z]\d{3}[A-Z]{3})$/, "Patente inválida (ej. AB123CD o ABC123).")),
  brand: z.string().trim().min(2, "Ingresá la marca."),
  model: z.string().trim().min(1, "Ingresá el modelo."),
  version: opcional,
  year: z.coerce.number().int().min(1950, "Año inválido.").max(new Date().getFullYear() + 1, "Año inválido."),
  mileageKm: z.coerce.number().int().min(0, "Kilometraje inválido."),
  bodyType: opcional,
  color: opcional,
  engineNumber: opcional,
  vin: opcional,
  fuelType: z.enum(["NAFTA", "DIESEL", "GNC", "HIBRIDO", "ELECTRICO"]).default("NAFTA"),
  transmission: z.enum(["MANUAL", "AUTOMATICA"]).default("MANUAL"),
  priceArs: montoPositivo,
  purchasePriceArs: montoOpcional,
  description: opcional,
});
export type VehiculoValues = z.input<typeof vehiculoSchema>;

export const operacionSchema = z.object({
  vehicleId: z.string().min(1, "Elegí el auto."),
  sellerIsDealership: z.boolean(),
  seller: personaSchema.optional(),
  buyer: personaSchema,
  priceArs: montoPositivo,
  depositArs: montoOpcional,
  paymentMethod: z.enum(["CONTADO", "TRANSFERENCIA", "FINANCIADO", "PERMUTA", "MIXTO"]),
  paymentNotes: opcional,
  tradeInDescription: opcional,
  tradeInPatente: opcional,
  tradeInValueArs: montoOpcional,
  ivaRate: z.coerce.number().min(0).max(27).default(21),
  saleDate: z.string().min(1),
  notes: opcional,
});
export type OperacionValues = z.input<typeof operacionSchema>;

export const reciboSchema = z.object({
  saleId: z.string().min(1),
  amountArs: montoPositivo,
  concept: z.string().trim().min(2, "Indicá el concepto."),
  method: z.enum(["CONTADO", "TRANSFERENCIA", "FINANCIADO", "PERMUTA", "MIXTO"]),
  date: z.string().min(1),
  notes: opcional,
});
export type ReciboValues = z.input<typeof reciboSchema>;

export const facturaSchema = z.object({
  saleId: z.string().min(1),
  invoiceNumber: z.coerce.number().int().positive().optional(),
  afipCae: opcional,
  afipCaeExpiry: opcional,
});

export const entregaSchema = z.object({
  saleId: z.string().min(1),
  deliveryDate: z.string().min(1),
  deliveryKm: z.coerce.number().int().min(0),
});

export const datosFiscalesSchema = z.object({
  pointOfSale: z.coerce.number().int().min(1).max(99999),
  grossIncomeNumber: opcional,
  activityStartDate: opcional,
});

/** Convierte "" / undefined en null para guardar en la base. */
export const nn = (v: string | undefined | null) => (v ? v : null);
