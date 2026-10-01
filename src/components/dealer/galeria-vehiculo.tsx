"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";

import { borrarFotoAction, marcarPortadaAction } from "@/lib/actions/vehiculos";
import { subirFoto } from "@/lib/comprimir-imagen";
import { Miniatura } from "@/components/dealer/selector-fotos";

interface Foto {
  id: string;
  src: string;
  isCover: boolean;
}

export function GaleriaVehiculo({ vehicleId, fotos }: { vehicleId: string; fotos: Foto[] }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activa, setActiva] = React.useState(0);
  const principal = fotos[activa] ?? fotos[0];

  const subir = async (files: FileList) => {
    setError(null);
    const lista = Array.from(files);
    for (let i = 0; i < lista.length; i++) {
      setSubiendo(`Subiendo ${i + 1} de ${lista.length}…`);
      try {
        await subirFoto(vehicleId, lista[i]);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setSubiendo(null);
    router.refresh();
  };

  return (
    <div className="grid gap-3">
      <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-2xl border">
        {principal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={principal.src} alt="" className="size-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2"
          >
            <ImagePlus className="size-8" />
            Agregá fotos del auto
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {fotos.map((f, i) => (
          <div key={f.id} onMouseEnter={() => setActiva(i)} onClick={() => setActiva(i)}>
            <Miniatura
              src={f.src}
              esPortada={f.isCover}
              onQuitar={async () => {
                if (!confirm("¿Borrar esta foto?")) return;
                await borrarFotoAction(f.id);
                setActiva(0);
                router.refresh();
              }}
              onPortada={async () => {
                await marcarPortadaAction(f.id);
                router.refresh();
              }}
            />
          </div>
        ))}
        <button
          type="button"
          disabled={!!subiendo}
          onClick={() => inputRef.current?.click()}
          className="border-input hover:bg-accent text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs"
        >
          {subiendo ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {subiendo ?? "Agregar"}
        </button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) subir(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
