"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";

import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { confianza: false } });

  // Desde la app instalada en el celular o la compu, el aparato es de Javier: viene marcado.
  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setValue("confianza", true);
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setServerError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      confianza: values.confianza ? "1" : "0",
      redirect: false,
    });

    if (result?.error) {
      setServerError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/dealer");
    router.refresh();
  });

  return (
    <Card className="w-full max-w-sm border-0 shadow-2xl shadow-black/40">
      <CardHeader>
        <CardTitle className="text-xl">Iniciar sesión</CardTitle>
        <CardDescription>Entrá al panel de tu concesionaria.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
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
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>
          <label className="bg-muted/50 flex cursor-pointer items-start gap-3 rounded-xl border p-3">
            <input type="checkbox" className="accent-primary mt-0.5 size-5 shrink-0" {...register("confianza")} />
            <span className="grid gap-0.5 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="size-4" /> Es mi celular o mi compu
              </span>
              <span className="text-muted-foreground text-xs">
                Queda abierta 30 días. En una compu ajena dejalo sin marcar: se cierra al cerrar el navegador.
              </span>
            </span>
          </label>
          {serverError && <p className="text-destructive text-sm">{serverError}</p>}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            Ingresar
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Registrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
