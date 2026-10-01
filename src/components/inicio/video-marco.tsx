"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Video vertical en un marco con esquinas doradas. Arranca solo, sin sonido y
 * en loop (los navegadores solo permiten autoplay silenciado); el botón activa
 * el audio.
 */
export function VideoMarco({ fuentes, poster }: { fuentes: { src: string; type: string }[]; poster?: string }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [muteado, setMuteado] = React.useState(true);

  // React no refleja `muted` como atributo del DOM, y sin él los navegadores
  // (Safari en iPhone sobre todo) bloquean el autoplay: se fuerza acá.
  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => undefined);
  }, []);

  const alternarSonido = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuteado(v.muted);
    if (!v.muted) v.play().catch(() => undefined);
  };

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-[#d4ad55]/10 blur-3xl" />
      <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-black/60">
        <video
          ref={ref}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="size-full object-cover"
        >
          {/* WebM primero (Chrome/Android/Firefox), MP4 como respaldo (Safari/iPhone) */}
          {fuentes.map((f) => (
            <source key={f.src} src={f.src} type={f.type} />
          ))}
        </video>
        {/* Esquinas tipo visor de cámara */}
        <span className="pointer-events-none absolute top-5 left-5 size-12 border-t-[3px] border-l-[3px] border-[#d4ad55]" />
        <span className="pointer-events-none absolute right-5 bottom-5 size-12 border-r-[3px] border-b-[3px] border-[#d4ad55]" />
        <button
          type="button"
          onClick={alternarSonido}
          aria-label={muteado ? "Activar sonido" : "Silenciar"}
          className="absolute top-5 right-5 flex size-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
        >
          {muteado ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      </div>
    </div>
  );
}
