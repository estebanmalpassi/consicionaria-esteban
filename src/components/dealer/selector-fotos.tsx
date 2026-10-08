"use client";

import * as React from "react";
import { Camera, ImagePlus, Star, X } from "lucide-react";

import { TOMAS_SUGERIDAS } from "@/lib/fotos";
import { cn } from "@/lib/utils";

export interface FotoPendiente {
  key: string;
  file: File;
  preview: string;
  label?: string;
}

/**
 * Guía de fotos: casilleros con las tomas recomendadas (frente, lateral,
 * interior...). En el celular, tocar un casillero abre directo la cámara.
 * También acepta arrastrar varias fotos juntas desde la computadora.
 */
export function SelectorFotos({
  fotos,
  onChange,
}: {
  fotos: FotoPendiente[];
  onChange: (fotos: FotoPendiente[]) => void;
}) {
  const [arrastrando, setArrastrando] = React.useState(false);
  const multipleRef = React.useRef<HTMLInputElement>(null);

  const agregar = (files: FileList | File[], label?: string) => {
    const nuevas = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file, i) => ({
        key: `${Date.now()}-${i}-${file.name}`,
        file,
        preview: URL.createObjectURL(file),
        label: label ?? tomaLibre(fotos, i),
      }));
    onChange(label ? [...fotos.filter((f) => f.label !== label), ...nuevas] : [...fotos, ...nuevas]);
  };

  const quitar = (key: string) => onChange(fotos.filter((f) => f.key !== key));
  const hacerPortada = (key: string) => {
    const f = fotos.find((x) => x.key === key);
    if (f) onChange([f, ...fotos.filter((x) => x.key !== key)]);
  };

  const extras = fotos.filter((f) => !TOMAS_SUGERIDAS.includes(f.label as (typeof TOMAS_SUGERIDAS)[number]));
  const hechas = TOMAS_SUGERIDAS.filter((t) => fotos.some((f) => f.label === t)).length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        agregar(e.dataTransfer.files);
      }}
      className={cn("grid gap-3 rounded-xl transition", arrastrando && "ring-primary/40 bg-primary/5 ring-4")}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Tomas recomendadas: <b className="text-foreground">{hechas}</b> de {TOMAS_SUGERIDAS.length}
        </span>
        <span className="text-muted-foreground hidden sm:inline">o arrastrá las fotos acá</span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TOMAS_SUGERIDAS.map((toma) => {
          const foto = fotos.find((f) => f.label === toma);
          return (
            <Casillero
              key={toma}
              toma={toma}
              foto={foto}
              esPortada={!!foto && fotos[0]?.key === foto.key}
              onElegir={(files) => agregar(files, toma)}
              onQuitar={() => foto && quitar(foto.key)}
              onPortada={() => foto && hacerPortada(foto.key)}
            />
          );
        })}
      </div>

      {extras.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {extras.map((foto) => (
            <Miniatura
              key={foto.key}
              src={foto.preview}
              esPortada={fotos[0]?.key === foto.key}
              onQuitar={() => quitar(foto.key)}
              onPortada={() => hacerPortada(foto.key)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => multipleRef.current?.click()}
        className="border-input hover:bg-accent text-muted-foreground flex h-12 items-center justify-center gap-2 rounded-lg border border-dashed text-sm"
      >
        <ImagePlus className="size-4" /> Agregar más fotos de la galería
      </button>
      <input
        ref={multipleRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) agregar(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function tomaLibre(fotos: FotoPendiente[], offset: number) {
  const libres = TOMAS_SUGERIDAS.filter((t) => !fotos.some((f) => f.label === t));
  return libres[offset];
}

function Casillero({
  toma,
  foto,
  esPortada,
  onElegir,
  onQuitar,
  onPortada,
}: {
  toma: string;
  foto?: FotoPendiente;
  esPortada: boolean;
  onElegir: (files: FileList) => void;
  onQuitar: () => void;
  onPortada: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  if (foto) {
    return (
      <div className="grid gap-1">
        <Miniatura src={foto.preview} esPortada={esPortada} onQuitar={onQuitar} onPortada={onPortada} />
        <span className="text-muted-foreground truncate text-center text-[11px]">{toma}</span>
      </div>
    );
  }
  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        aria-label={`Sacar foto: ${toma}`}
        className="border-input hover:border-primary hover:text-primary text-muted-foreground bg-muted/40 relative flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition"
      >
        <IconoToma toma={toma} />
        <Camera className="absolute right-1.5 bottom-1.5 size-3.5 opacity-60" />
      </button>
      <span className="text-muted-foreground truncate text-center text-[11px]">{toma}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onElegir(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Dibujito de cada toma, para saber de un vistazo qué foto va en cada casillero. */
function IconoToma({ toma }: { toma: string }) {
  const trazos: Record<string, React.ReactNode> = {
    "Frente 3/4": (
      <>
        <path d="M6 25h46l2-6-8-3-7-7H20l-7 7-6 2z" />
        <path d="M21 10l-4 6h18l-3-6M38 16h8" />
        <circle cx="16" cy="25" r="4" />
        <circle cx="43" cy="25" r="4" />
        <path d="M50 19h3" />
      </>
    ),
    Lateral: (
      <>
        <path d="M4 24h52M8 24v-5l8-2 7-7h16l9 7 6 1v6" />
        <path d="M24 11v6M16 17h32" />
        <circle cx="17" cy="24" r="4.5" />
        <circle cx="44" cy="24" r="4.5" />
      </>
    ),
    Trasera: (
      <>
        <path d="M12 27V15l5-7h26l5 7v12z" />
        <path d="M18 14l3-4h18l3 4zM12 20h7M41 20h7M24 21h12" />
        <path d="M14 27v3M46 27v3" />
      </>
    ),
    Interior: (
      <>
        <circle cx="30" cy="17" r="11" />
        <circle cx="30" cy="17" r="3" />
        <path d="M30 20v8M27.2 15.8 19.6 12M32.8 15.8l7.6-3.8" />
      </>
    ),
    "Tablero / km": (
      <>
        <path d="M13 26a17 17 0 1 1 34 0" />
        <path d="M30 26l8-10M17 21l3 1M43 21l-3 1M22 13l2 2.5M38 13l-2 2.5M30 9v3" />
        <circle cx="30" cy="26" r="1.5" />
      </>
    ),
    Motor: (
      <>
        <rect x="16" y="11" width="26" height="15" rx="2" />
        <path d="M22 11V7h14v4M42 15h5v7h-5M16 17h-5v4h5M24 26v3M34 26v3M21 16h16" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 60 34" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-8 w-14">
      {trazos[toma] ?? <path d="M4 24h52M10 24l6-9h22l8 9" />}
    </svg>
  );
}

export function Miniatura({
  src,
  esPortada,
  onQuitar,
  onPortada,
}: {
  src: string;
  esPortada: boolean;
  onQuitar: () => void;
  onPortada: () => void;
}) {
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
      <button
        type="button"
        onClick={onQuitar}
        aria-label="Quitar foto"
        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
      >
        <X className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onPortada}
        className={cn(
          "absolute bottom-1 left-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          esPortada ? "bg-primary text-primary-foreground" : "bg-black/60 text-white opacity-80"
        )}
      >
        <Star className="size-3" /> {esPortada ? "Portada" : "Usar de portada"}
      </button>
    </div>
  );
}
