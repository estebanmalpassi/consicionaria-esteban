import { z } from "zod";

/** Validates an Argentine CUIT: 11 digits (with or without dashes) + check digit. */
export function isValidCuit(raw: string): boolean {
  const cuit = raw.replace(/\D/g, "");
  if (cuit.length !== 11) return false;

  const digits = cuit.split("").map(Number);
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = multipliers.reduce((acc, m, i) => acc + m * digits[i], 0);
  const mod = 11 - (sum % 11);
  const checkDigit = mod === 11 ? 0 : mod === 10 ? 9 : mod;

  return checkDigit === digits[10];
}

export const businessInfoSchema = z.object({
  legalName: z.string().min(3, "Ingresá la razón social completa."),
  tradeName: z.string().min(2, "Ingresá el nombre comercial."),
  cuit: z.string().refine(isValidCuit, "El CUIT ingresado no es válido."),
  afipConditionIva: z.enum([
    "RESPONSABLE_INSCRIPTO",
    "MONOTRIBUTO",
    "EXENTO",
  ]),
});

export const contactInfoSchema = z.object({
  addressStreet: z.string().min(5, "Ingresá la dirección completa."),
  addressCity: z.string().min(2, "Ingresá la localidad."),
  province: z.string().min(2, "Seleccioná la provincia."),
  postalCode: z.string().min(3, "Ingresá el código postal."),
  phone: z.string().min(6, "Ingresá un teléfono de contacto."),
  website: z.string().url("URL inválida.").optional().or(z.literal("")),
});

export const afipCredentialsSchema = z.object({
  afipDelegationAccepted: z.literal(true, {
    message: "Debés autorizar el acceso de solo lectura vía Clave Fiscal.",
  }),
  afipCredentialId: z.string().min(1, "Falta vincular la Clave Fiscal."),
});

export const documentsSchema = z.object({
  cuitConstanciaUrl: z.string().min(1, "Subí la constancia de inscripción AFIP."),
  legalIdUrl: z.string().min(1, "Subí el DNI del representante legal."),
  businessLicenseUrl: z.string().optional(),
});

export const dealershipOnboardingSchema = businessInfoSchema
  .merge(contactInfoSchema)
  .merge(afipCredentialsSchema)
  .merge(documentsSchema);

export type DealershipOnboardingValues = z.infer<typeof dealershipOnboardingSchema>;

export const AFIP_CONDITION_LABELS: Record<
  DealershipOnboardingValues["afipConditionIva"],
  string
> = {
  RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
  MONOTRIBUTO: "Monotributo",
  EXENTO: "Exento",
};

export const ARGENTINE_PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];
