"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { registerAction } from "@/lib/actions/auth";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: "BUYER" },
  });

  const accountType = watch("accountType");

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setServerError(null);
    const result = await registerAction(values);
    setLoading(false);

    if (!result.ok) {
      setServerError(result.error ?? "No pudimos crear tu cuenta.");
      return;
    }

    router.push(result.redirectTo ?? "/");
    router.refresh();
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Crear cuenta</CardTitle>
        <CardDescription>Elegí el tipo de cuenta que necesitás.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue("accountType", "BUYER")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors",
                accountType === "BUYER"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <User className="size-5" />
              Comprador
            </button>
            <button
              type="button"
              onClick={() => setValue("accountType", "DEALER_OWNER")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors",
                accountType === "DEALER_OWNER"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Building2 className="size-5" />
              Concesionaria
            </button>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">Repetir contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>
          {serverError && <p className="text-destructive text-sm">{serverError}</p>}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
