"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { EVENTO_TEMA, guardarTema, leerTema, type Tema } from "@/lib/tema";
import { cn } from "@/lib/utils";

const OPCIONES: { valor: Tema; texto: string; detalle: string; icono: typeof Sun }[] = [
  { valor: "claro", texto: "Claro", detalle: "Fondo blanco", icono: Sun },
  { valor: "oscuro", texto: "Oscuro", detalle: "Fondo azul noche", icono: Moon },
  { valor: "auto", texto: "Automático", detalle: "Como esté el celular", icono: Monitor },
];

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO_TEMA, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_TEMA, avisar);
    window.removeEventListener("storage", avisar);
  };
}

/** Elegir claro, oscuro o automático. Se guarda en este dispositivo. */
export function SelectorTema() {
  const tema = React.useSyncExternalStore(suscribir, leerTema, () => null);

  return (
    <div role="radiogroup" aria-label="Apariencia del panel" className="grid grid-cols-3 gap-2">
      {OPCIONES.map(({ valor, texto, detalle, icono: Icono }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={tema === valor}
          onClick={() => guardarTema(valor)}
          className={cn(
            "grid justify-items-center gap-1 rounded-xl border p-3 text-center transition-colors",
            tema === valor ? "border-primary bg-primary/10 ring-primary/30 ring-2" : "hover:bg-accent"
          )}
        >
          <Icono className="size-5" />
          <span className="text-sm font-semibold">{texto}</span>
          <span className="text-muted-foreground text-[11px] leading-tight">{detalle}</span>
        </button>
      ))}
    </div>
  );
}

/** En modo automático, sigue al celular si cambia de claro a oscuro con la app abierta. */
export function SeguirTemaDelSistema() {
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const cambio = () => {
      if (leerTema() === "auto") guardarTema("auto");
    };
    mq.addEventListener("change", cambio);
    return () => mq.removeEventListener("change", cambio);
  }, []);
  return null;
}
