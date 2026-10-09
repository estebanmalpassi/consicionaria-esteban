"use client";

import * as React from "react";
import { CarFront } from "lucide-react";
import Splide from "@splidejs/splide";
import "@splidejs/splide/css/core";

import { cn } from "@/lib/utils";

export interface AutoCarrusel {
  id: string;
  titulo: string;
  detalle: string;
  /** Tipo de auto o "0 km", en la esquina de la foto. */
  etiqueta?: string | null;
  /** null = auto de muestra, sin foto real. */
  foto: string | null;
  whatsapp: string;
}

/**
 * Carrusel de autos con Splide: 3 por pantalla en computadora, 2 en tablet y
 * 1 en el celular. No avanza solo: el cliente pasa con el dedo, las flechas o
 * los puntos.
 */
export function CarruselAutos({ autos }: { autos: AutoCarrusel[] }) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const splide = new Splide(ref.current, {
      perPage: 3,
      gap: "2rem",
      arrows: true,
      pagination: true,
      breakpoints: {
        640: { perPage: 2, gap: ".7rem" },
        480: { perPage: 1, gap: ".7rem" },
      },
      i18n: {
        prev: "Auto anterior",
        next: "Auto siguiente",
        first: "Ir al primer auto",
        last: "Ir al último auto",
        slideX: "Ir al auto %s",
        pageX: "Ir a la página %s",
        carousel: "carrusel",
        slide: "auto",
        slideLabel: "%s de %s",
      },
    });
    splide.mount();
    return () => {
      splide.destroy();
    };
  }, [autos]);

  return (
    <section ref={ref} className="splide carrusel-autos mt-10" aria-label="Autos disponibles">
      <div className="splide__track">
        <ul className="splide__list">
          {autos.map((a) => (
            <li key={a.id} className="splide__slide">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(ellipse_at_center,#1f3348_0%,#0d1824_72%)]">
                  {a.foto ? (
                    <FotoAuto src={a.foto} alt={a.titulo} />
                  ) : (
                    <FotoEjemplo />
                  )}
                  {a.etiqueta && (
                    <span className="absolute top-3 left-3 rounded-full bg-[#0b1520]/80 px-3 py-1 text-[11px] font-bold tracking-[0.15em] text-[#d4ad55] uppercase backdrop-blur">
                      {a.etiqueta}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 items-end justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-lg leading-tight font-bold">{a.titulo}</p>
                    <p className="line-clamp-2 text-sm text-white/60">{a.detalle}</p>
                  </div>
                  <a
                    href={a.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#d4ad55] px-4 text-sm font-bold text-[#0b1520] transition hover:brightness-110"
                  >
                    Consultar
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Foto del auto. Las horizontales llenan la tarjeta; las verticales (por ejemplo
 * las de Instagram, 4:5 o 9:16) se ven enteras, con la misma foto desenfocada de
 * fondo, para no cortarle el auto.
 */
function FotoAuto({ src, alt }: { src: string; alt: string }) {
  const [vertical, setVertical] = React.useState(false);
  const medir = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth) setVertical(img.naturalHeight > img.naturalWidth * 1.05);
  };
  return (
    <>
      {vertical && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover blur-xl brightness-50" draggable={false} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={medir}
        onLoad={(e) => medir(e.currentTarget)}
        src={src}
        alt={alt}
        className={cn("relative size-full", vertical ? "object-contain" : "object-cover")}
        loading="lazy"
        draggable={false}
      />
    </>
  );
}

/** Imagen para los autos de muestra: deja claro que no es una foto real. */
function FotoEjemplo() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 text-[#d4ad55]/70">
      <CarFront className="size-16" strokeWidth={1.25} />
      <span className="text-[11px] font-semibold tracking-[0.25em] text-white/40 uppercase">Foto de ejemplo</span>
    </div>
  );
}
