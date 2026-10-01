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
        className="border-input hover:border-primary hover:text-primary text-muted-foreground bg-muted/40 flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition"
      >
        <Camera className="size-5" />
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
