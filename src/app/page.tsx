import { ArrowDown, BadgeCheck, CarFront, FileCheck2, Handshake, MapPin, Sparkles } from "lucide-react";

import { getAgencia } from "@/lib/dealer";
import { FOTO_SELECT, fotoUrl } from "@/lib/fotos";
import { MARCA, linkWhatsapp } from "@/lib/marca";
import { prisma } from "@/lib/prisma";
import { formatKm } from "@/lib/utils";
import { FUEL_LABELS } from "@/types/vehicle";
import { CarruselAutos, type AutoCarrusel } from "@/components/inicio/carrusel-autos";
import { VideoMarco } from "@/components/inicio/video-marco";
import { AUTOS_EJEMPLO } from "@/lib/autos-ejemplo";

const CONSULTA_GENERAL = linkWhatsapp(`¡Hola! Vengo de la página de ${MARCA.nombre} y quería hacer una consulta.`);

const SERVICIOS = [
  { icono: BadgeCheck, titulo: "Usados seleccionados", texto: "Elegimos cada usado que ofrecemos." },
  { icono: Sparkles, titulo: "0 km de diversas marcas", texto: "Consultanos por todas las versiones." },
  { icono: FileCheck2, titulo: "Servicios de gestoría", texto: "Transferencias y trámites, sin que pierdas tiempo." },
  { icono: Handshake, titulo: "Asesoramiento personalizado", texto: "Te acompañamos desde la consulta hasta la entrega." },
];

/** Portada pública para clientes: quiénes somos, video y autos disponibles. */
export default async function Inicio({ searchParams }: PageProps<"/">) {
  const [agencia, params] = await Promise.all([getAgencia(), searchParams]);
  const muestra = params.muestra === "1";
  // Solo los autos de la agencia: otras cuentas no pueden publicar en esta portada.
  const stock = muestra || !agencia
    ? []
    : await prisma.vehicle.findMany({
        where: { dealershipId: agencia.id, status: { notIn: ["SOLD", "REJECTED", "PAUSED"] }, photos: { some: {} } },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          id: true,
          brand: true,
          model: true,
          version: true,
          year: true,
          mileageKm: true,
          fuelType: true,
          bodyType: true,
          photos: { select: FOTO_SELECT, orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1 },
        },
      });
  const autos: AutoCarrusel[] = muestra
    ? AUTOS_EJEMPLO.map((a) => ({
        ...a,
        whatsapp: linkWhatsapp(`¡Hola! Me interesa el ${a.titulo} que vi en la página. ¿Sigue disponible?`),
      }))
    : stock.map((a) => ({
        id: a.id,
        titulo: `${a.brand} ${a.model}`,
        detalle: [a.version, a.year, a.mileageKm > 0 ? formatKm(a.mileageKm) : "0 km", FUEL_LABELS[a.fuelType]]
          .filter(Boolean)
          .join(" · "),
        etiqueta: a.mileageKm === 0 ? "0 km" : a.bodyType,
        foto: fotoUrl(a.photos[0]),
        whatsapp: linkWhatsapp(
          `¡Hola! Me interesa el ${a.brand} ${a.model}${a.version ? ` ${a.version}` : ""} ${a.year} que vi en la página. ¿Sigue disponible?`
        ),
      }));

  return (
    <div className="flex-1 overflow-x-hidden bg-[#0b1520] font-[family-name:var(--font-marca)] text-white">
      {/* Barra superior */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARCA.logoCirculo} alt={MARCA.nombre} className="size-11 rounded-full ring-1 ring-[#d4ad55]/40" />
        </div>
      </header>

      {/* Portada */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,#1f3348_0%,#0d1824_55%,#0b1520_100%)] px-4 pt-28 pb-20 text-center sm:pt-36">
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-[#d4ad55]/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARCA.logoEscudo} alt={MARCA.nombre} className="w-64 drop-shadow-[0_10px_40px_rgba(212,173,85,0.3)] sm:w-80" />
          <p className="text-xs font-semibold tracking-[0.3em] text-[#d4ad55] uppercase sm:text-sm">{MARCA.eslogan}</p>
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-6xl">
            ¿Buscás un auto <span className="text-[#d4ad55]">sin vueltas?</span>
          </h1>
          <p className="max-w-xl text-base text-balance text-white/70 sm:text-lg">
            Usados seleccionados, 0 km de diversas marcas y gestoría propia. Te esperamos en Berrotarán, Córdoba.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={CONSULTA_GENERAL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 font-bold text-[#0b1520] shadow-lg shadow-[#25d366]/20 transition hover:brightness-110"
            >
              <IconoWhatsapp className="size-5" /> Escribinos
            </a>
            <a
              href={autos.length ? "#autos" : "#conocenos"}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#d4ad55]/60 px-6 font-semibold text-[#d4ad55] transition hover:bg-[#d4ad55]/10"
            >
              {autos.length ? "Ver autos disponibles" : "Conocenos"} <ArrowDown className="size-4" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">
            <span>Confianza</span>
            <span className="text-[#d4ad55]">◆</span>
            <span>Rapidez</span>
            <span className="text-[#d4ad55]">◆</span>
            <span>Transparencia</span>
          </div>
        </div>
      </section>

      {/* Cifras */}
      <section className="border-y border-white/5 bg-[#0e1a27]">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-white/5 px-2 py-8 text-center">
          <Cifra valor="+25" texto="años de trayectoria" />
          <Cifra valor="0 km" texto="y usados seleccionados" />
          <Cifra valor="Gestoría" texto="para tus trámites" />
        </div>
      </section>

      {/* Servicios */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Titulo antetitulo="Qué hacemos" titulo="Todo para tu próximo auto, en un solo lugar" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICIOS.map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#d4ad55]/40">
              <span className="flex size-12 items-center justify-center rounded-xl bg-[#d4ad55]/10 text-[#d4ad55]">
                <Icono className="size-6" />
              </span>
              <p className="mt-5 text-lg font-bold">{titulo}</p>
              <p className="mt-1 text-sm text-white/60">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historia + video */}
      <section id="conocenos" className="overflow-hidden bg-[linear-gradient(180deg,#0b1520_0%,#111f2e_100%)] px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1fr_360px]">
          <div className="text-center md:text-left">
            <Titulo antetitulo="Nuestra historia" titulo="Más de 25 años en Berrotarán" alinear="izquierda" />
            <div className="mt-6 space-y-4 text-lg text-white/70">
              {MARCA.historia.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p>
                Hoy seguimos con la misma idea: que cada cliente se vaya con el auto que buscaba y con todos los papeles en
                regla.
              </p>
            </div>
          </div>
          <VideoMarco fuentes={[...MARCA.videoFuentes]} poster={MARCA.videoPoster} />
        </div>
      </section>

      {/* Autos disponibles (del stock cargado en el panel) */}
      {autos.length > 0 && (
        <section id="autos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Titulo antetitulo="Usados seleccionados" titulo="Autos disponibles" />
          {muestra && (
            <p className="mx-auto mt-4 w-fit rounded-full border border-[#d4ad55]/40 bg-[#d4ad55]/10 px-4 py-1.5 text-center text-xs font-semibold text-[#d4ad55]">
              Vista de muestra: estos autos son ejemplos
            </p>
          )}
          <CarruselAutos autos={autos} />
        </section>
      )}

      {/* Ubicación */}
      <section className="border-t border-white/5 bg-[#0e1a27] px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-start gap-4">
            <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-[#d4ad55]/10 text-[#d4ad55] md:flex">
              <MapPin className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-[#d4ad55] uppercase">Visitanos</p>
              <p className="mt-1 text-xl font-bold">{MARCA.direccion}</p>
              <p className="text-white/60">{MARCA.referencia}</p>
              <a href={CONSULTA_GENERAL} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-[#25d366] hover:underline">
                <IconoWhatsapp className="size-4" /> {MARCA.whatsappVisible}
              </a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={MARCA.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold transition hover:border-[#d4ad55]/60"
            >
              <MapPin className="size-4" /> Cómo llegar
            </a>
            <a
              href={MARCA.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold transition hover:border-[#d4ad55]/60"
            >
              <CarFront className="size-4" /> @{MARCA.instagram}
            </a>
          </div>
        </div>
      </section>

      <footer className="px-4 pt-8 pb-28 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {MARCA.nombre} · {MARCA.eslogan}
      </footer>

      {/* WhatsApp flotante */}
      <a
        href={CONSULTA_GENERAL}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribinos por WhatsApp"
        className="fixed right-5 bottom-5 z-30 flex size-16 items-center justify-center rounded-full bg-[#25d366] text-white shadow-xl shadow-black/40 ring-4 ring-[#25d366]/25 transition hover:scale-105"
      >
        <IconoWhatsapp className="size-8" />
      </a>
    </div>
  );
}

function Titulo({ antetitulo, titulo, alinear = "centro" }: { antetitulo: string; titulo: string; alinear?: "centro" | "izquierda" }) {
  return (
    <div className={alinear === "centro" ? "text-center" : "text-center md:text-left"}>
      <p className="text-xs font-semibold tracking-[0.3em] text-[#d4ad55] uppercase">{antetitulo}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{titulo}</h2>
    </div>
  );
}

function Cifra({ valor, texto }: { valor: string; texto: string }) {
  return (
    <div className="px-2">
      <p className="text-2xl font-extrabold text-[#d4ad55] sm:text-4xl">{valor}</p>
      <p className="mt-1 text-[11px] text-white/60 sm:text-sm">{texto}</p>
    </div>
  );
}

function IconoWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}
