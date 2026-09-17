import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Ingresá tu nombre completo."),
    email: z.string().email("Ingresá un email válido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string(),
    accountType: z.enum(["BUYER", "DEALER_OWNER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
