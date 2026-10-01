"use client";

import * as React from "react";
import { CarFront, ChevronLeft, ChevronRight } from "lucide-react";

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

const INTERVALO_MS = 3500;
/** Después de que el cliente toca o arrastra, se saltean estos avances antes de seguir solo. */
const AVANCES_EN_PAUSA_TRAS_TOCAR = 2;

/**
 * Carrusel de autos: 3 tarjetas en computadora (1 y media en el celular) que
 * avanzan solas de a una y vuelven al principio al llegar al final. Se frena
 * con el mouse encima, al tocarlo o si el cliente prefiere menos movimiento.
 */
export function CarruselAutos({ autos }: { autos: AutoCarrusel[] }) {
  const pista = React.useRef<HTMLDivElement>(null);
  const [actual, setActual] = React.useState(0);
  const [cantidadPuntos, setCantidadPuntos] = React.useState(autos.length);
  const pausado = React.useRef(false);
  const avancesEnPausa = React.useRef(0);

  const pasoTarjeta = React.useCallback(() => {
    const el = pista.current;
    const primera = el?.firstElementChild as HTMLElement | null;
    if (!el || !primera) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    return primera.offsetWidth + gap;
  }, []);

  const mover = React.useCallback(
    (direccion: 1 | -1) => {
      const el = pista.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 4) return;
      if (direccion === 1 && el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else if (direccion === -1 && el.scrollLeft <= 4) el.scrollTo({ left: max, behavior: "smooth" });
      else el.scrollBy({ left: direccion * pasoTarjeta(), behavior: "smooth" });
    },
    [pasoTarjeta]
  );

  // Puntos: uno por cada posición posible (autos que no entran a la vez + 1).
  const medir = React.useCallback(() => {
    const el = pista.current;
    const paso = pasoTarjeta();
    if (!el || !paso) return;
    const visibles = Math.max(1, Math.round(el.clientWidth / paso));
    setCantidadPuntos(Math.max(1, autos.length - visibles + 1));
    setActual(Math.min(autos.length - 1, Math.round(el.scrollLeft / paso)));
  }, [autos.length, pasoTarjeta]);

  React.useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [medir]);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (avancesEnPausa.current > 0) {
        avancesEnPausa.current -= 1;
        return;
      }
      if (pausado.current || document.hidden) return;
      mover(1);
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [mover]);

  const tocado = () => {
    avancesEnPausa.current = AVANCES_EN_PAUSA_TRAS_TOCAR;
  };

  const irA = (i: number) => {
    tocado();
    pista.current?.scrollTo({ left: i * pasoTarjeta(), behavior: "smooth" });
  };

  return (
    <div
      className="relative mt-10"
      onMouseEnter={() => (pausado.current = true)}
      onMouseLeave={() => (pausado.current = false)}
      onFocusCapture={() => (pausado.current = true)}
      onBlurCapture={() => (pausado.current = false)}
      onPointerDown={tocado}
      onWheel={tocado}
    >
      <div
        ref={pista}
        onScroll={medir}
        aria-roledescription="carrusel"
        aria-label="Autos disponibles"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {autos.map((a, i) => (
          <article
            key={a.id}
            aria-roledescription="tarjeta"
            aria-label={`${i + 1} de ${autos.length}: ${a.titulo}`}
            className="group w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-[#d4ad55]/40 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
              {a.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.foto}
                  alt={a.titulo}
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <FotoEjemplo />
              )}
              {a.etiqueta && (
                <span className="absolute top-3 left-3 rounded-full bg-[#0b1520]/80 px-3 py-1 text-[11px] font-bold tracking-[0.15em] text-[#d4ad55] uppercase backdrop-blur">
                  {a.etiqueta}
                </span>
              )}
            </div>
            <div className="flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{a.titulo}</p>
                <p className="line-clamp-2 text-sm text-white/60">{a.detalle}</p>
              </div>
              <a
                href={a.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#d4ad55] px-4 text-sm font-bold text-[#0b1520] transition hover:brightness-110"
              >
                Consultar
              </a>
            </div>
          </article>
        ))}
      </div>

      {cantidadPuntos > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <BotonFlecha etiqueta="Anterior" onClick={() => (tocado(), mover(-1))}>
            <ChevronLeft className="size-5" />
          </BotonFlecha>
          <div className="flex items-center gap-2">
            {Array.from({ length: cantidadPuntos }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ir al auto ${i + 1}`}
                aria-current={i === Math.min(actual, cantidadPuntos - 1) ? "true" : undefined}
                className="h-2 w-2 rounded-full bg-white/25 transition-all aria-[current=true]:w-6 aria-[current=true]:bg-[#d4ad55]"
              />
            ))}
          </div>
          <BotonFlecha etiqueta="Siguiente" onClick={() => (tocado(), mover(1))}>
            <ChevronRight className="size-5" />
          </BotonFlecha>
        </div>
      )}
    </div>
  );
}

function BotonFlecha({ etiqueta, onClick, children }: { etiqueta: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-[#d4ad55]/60 hover:text-white"
    >
      {children}
    </button>
  );
}

/** Imagen para los autos de muestra: deja claro que no es una foto real. */
function FotoEjemplo() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_center,#1f3348_0%,#0d1824_70%)] text-[#d4ad55]/70">
      <CarFront className="size-16" strokeWidth={1.25} />
      <span className="text-[11px] font-semibold tracking-[0.25em] text-white/40 uppercase">Foto de ejemplo</span>
    </div>
  );
}
