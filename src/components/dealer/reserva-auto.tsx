"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkX, HandCoins, Loader2 } from "lucide-react";

import { apartarVehiculoAction, liberarVehiculoAction } from "@/lib/actions/reservas";
import { Button } from "@/components/ui/button";
import { AvisoError, Entrada } from "@/components/dealer/campo";

export interface ApartadoVista {
  nombre: string;
  telefono: string | null;
  nota: string | null;
  desde: string;
}

/**
 * Dos formas de reservar un auto:
 * - con seña: abre la venta en modo reserva (sale boleto y recibo de la seña);
 * - sin seña: lo aparta a nombre de alguien, sin papeles, y lo saca de la web.
 */
export function ReservaAuto({ vehicleId, apartado }: { vehicleId: string; apartado: ApartadoVista | null }) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [nombre, setNombre] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [nota, setNota] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const apartar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const res = await apartarVehiculoAction(vehicleId, { nombre, telefono, nota });
    setEnviando(false);
    if (!res.ok) return setError(res.error ?? "No se pudo apartar el auto.");
    setAbierto(false);
    router.refresh();
  };

  const liberar = async () => {
    setEnviando(true);
    setError(null);
    const res = await liberarVehiculoAction(vehicleId);
    setEnviando(false);
    if (!res.ok) return setError(res.error ?? "No se pudo liberar el auto.");
    router.refresh();
  };

  if (apartado) {
    return (
      <div className="grid gap-3 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
        <div className="flex items-start gap-3">
          <Bookmark className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Apartado para {apartado.nombre}</p>
            <p className="opacity-80">
              Desde el {apartado.desde}
              {apartado.telefono ? ` · ${apartado.telefono}` : ""}
            </p>
            {apartado.nota && <p className="mt-1 opacity-80">{apartado.nota}</p>}
            <p className="mt-1 text-xs opacity-70">No se ve en la web mientras está apartado.</p>
          </div>
        </div>
        <AvisoError>{error}</AvisoError>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="bg-background h-11">
            <Link href={`/dealer/operaciones/nueva?auto=${vehicleId}&reserva=1`}>
              <HandCoins className="size-4" /> Tomar seña
            </Link>
          </Button>
          <Button type="button" variant="outline" className="bg-background h-11" onClick={liberar} disabled={enviando}>
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <BookmarkX className="size-4" />} Liberar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" className="h-11">
          <Link href={`/dealer/operaciones/nueva?auto=${vehicleId}&reserva=1`}>
            <HandCoins className="size-4" /> Reservar con seña
          </Link>
        </Button>
        <Button type="button" variant="outline" className="h-11" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
          <Bookmark className="size-4" /> Apartar sin seña
        </Button>
      </div>
      {abierto && (
        <form onSubmit={apartar} className="bg-card grid gap-2 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs">
            Para cuando el cliente pide que se lo guarden y todavía no pagó. El auto queda reservado y deja de verse en la web.
            No sale ningún papel.
          </p>
          <Entrada aria-label="Nombre de quien lo aparta" placeholder="Nombre de quien lo aparta" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={80} autoFocus />
          <Entrada aria-label="Teléfono (opcional)" placeholder="Teléfono (opcional)" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={40} />
          <Entrada aria-label="Nota (opcional)" placeholder="Nota (opcional), ej. viene el sábado a verlo" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={160} />
          <AvisoError>{error}</AvisoError>
          <Button type="submit" disabled={enviando} className="h-11">
            {enviando && <Loader2 className="size-4 animate-spin" />} Apartar auto
          </Button>
        </form>
      )}
    </div>
  );
}
