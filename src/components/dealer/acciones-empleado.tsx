"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, UserMinus } from "lucide-react";

import { hacerDuenoAction, quitarAccesoAction } from "@/lib/actions/equipo";
import { Button } from "@/components/ui/button";

/** Acciones del dueño sobre un empleado: pasarle la propiedad o quitarle el acceso. */
export function AccionesEmpleado({ userId, nombre }: { userId: string; nombre: string }) {
  const router = useRouter();
  const [cargando, setCargando] = React.useState<"dueno" | "quitar" | null>(null);

  const ejecutar = async (tipo: "dueno" | "quitar") => {
    const pregunta =
      tipo === "dueno"
        ? `¿Hacer dueño a ${nombre}? Vos vas a quedar como empleado y ${nombre} va a poder quitarte el acceso.`
        : `¿Quitarle el acceso al panel a ${nombre}?`;
    if (!confirm(pregunta)) return;
    setCargando(tipo);
    const res = tipo === "dueno" ? await hacerDuenoAction(userId) : await quitarAccesoAction(userId);
    setCargando(null);
    if (!res.ok) return alert(res.error);
    router.refresh();
  };

  return (
    <div className="flex gap-1">
      <Button type="button" variant="ghost" size="sm" disabled={!!cargando} onClick={() => ejecutar("dueno")}>
        {cargando === "dueno" ? <Loader2 className="size-4 animate-spin" /> : <Crown className="text-gold size-4" />} Hacer dueño
      </Button>
      <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={!!cargando} onClick={() => ejecutar("quitar")}>
        {cargando === "quitar" ? <Loader2 className="size-4 animate-spin" /> : <UserMinus className="size-4" />} Quitar acceso
      </Button>
    </div>
  );
}
