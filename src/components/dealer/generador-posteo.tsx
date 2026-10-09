"use client";

import * as React from "react";
import { Check, Copy, Crosshair, Download, ImagePlus, Loader2, Move, Share2, SquareDashed } from "lucide-react";

import { MARCA } from "@/lib/marca";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AreaTexto, Campo, Entrada } from "@/components/dealer/campo";

export interface PlantillaPosteo {
  id: string;
  nombre: string;
  /** Línea chica arriba del título ("Usados Seleccionados"). */
  antetitulo: string;
  titulo: string;
  detalle: string;
  /** Texto chico abajo, sobre el logo. */
  pie: string;
  /** Texto sugerido para la descripción del posteo. */
  epigrafe: string;
}

// Formato vertical 4:5, el que mejor ocupa la pantalla en el feed de Instagram.
const ANCHO = 1080;
const ALTO = 1350;
const AZUL = "17, 31, 46";

/** Cómo está ubicada la foto: corrimiento en píxeles del posteo y acercamiento (1 = sin zoom). */
interface Encuadre {
  x: number;
  y: number;
  zoom: number;
}

const ENCUADRE_INICIAL: Encuadre = { x: 0, y: 0, zoom: 1 };
const ZOOM_MIN = 0.3;
/** Parte de la altura de una foto típica que ocupa el auto (el resto es cielo y piso). */
const FRANJA_DEL_AUTO = 0.5;
const ZOOM_MAX = 3;

/** Franja del posteo que queda libre entre el texto de arriba y el de abajo: ahí conviene que vaya el auto. */
interface ZonaLibre {
  arriba: number;
  abajo: number;
}

/** Lo que hace falta para dibujar: se carga una vez por foto y después se redibuja al instante. */
interface Recursos {
  src: string | null;
  foto: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  fam: string;
}

/**
 * Arma una imagen con el estilo de los posteos de la agencia: foto a sangre,
 * recuadro azul semitransparente con el texto en blanco y el escudo abajo.
 * Todo se dibuja en el navegador (canvas), sin servicios externos.
 */
export function GeneradorPosteo({
  fotos,
  plantillas,
  nombreArchivo,
}: {
  fotos: { id: string; src: string }[];
  plantillas: PlantillaPosteo[];
  nombreArchivo: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const guiaRef = React.useRef<HTMLCanvasElement>(null);
  const zonaRef = React.useRef<ZonaLibre | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [plantillaId, setPlantillaId] = React.useState(plantillas[0].id);
  const [textos, setTextos] = React.useState(() => ({ ...plantillas[0] }));
  const [fotoSrc, setFotoSrc] = React.useState<string | null>(fotos[0]?.src ?? null);
  const [fotoPropia, setFotoPropia] = React.useState<string | null>(null);
  const [recursos, setRecursos] = React.useState<Recursos | null>(null);
  const [encuadre, setEncuadre] = React.useState<Encuadre>(ENCUADRE_INICIAL);
  const [acomodando, setAcomodando] = React.useState(false);
  const [copiado, setCopiado] = React.useState(false);
  const punteros = React.useRef(new Map<number, { x: number; y: number }>());
  const pellizco = React.useRef<{ distancia: number; zoom: number } | null>(null);

  const elegirPlantilla = (p: PlantillaPosteo) => {
    setPlantillaId(p.id);
    setTextos({ ...p });
  };

  const elegirFoto = (src: string) => {
    setFotoSrc(src);
    setEncuadre(ENCUADRE_INICIAL);
  };

  // Los botones se habilitan cuando la foto elegida ya está cargada (el dibujo es instantáneo).
  const listo = recursos?.src === fotoSrc;
  const foto = listo ? recursos.foto : null;

  React.useEffect(() => {
    let cancelado = false;
    cargarRecursos(fotoSrc).then((r) => {
      if (!cancelado) setRecursos(r);
    });
    return () => {
      cancelado = true;
    };
  }, [fotoSrc]);

  React.useEffect(() => {
    if (!recursos || recursos.src !== fotoSrc) return;
    zonaRef.current = dibujar(canvasRef.current, recursos, textos, encuadre);
    if (acomodando) dibujarGuia(guiaRef.current, zonaRef.current);
  }, [recursos, fotoSrc, textos, encuadre, acomodando]);

  /** Corre o acerca la foto sin dejar huecos (o, si es horizontal, sin que se salga del posteo). */
  const ajustar = React.useCallback(
    (cambio: (e: Encuadre) => Encuadre) => {
      if (!foto) return;
      setEncuadre((e) => limitar(cambio(e), foto));
    },
    [foto]
  );

  // Rueda del mouse para acercar (en la computadora). Tiene que ser un listener no pasivo para frenar el scroll.
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !acomodando) return;
    const rueda = (ev: WheelEvent) => {
      ev.preventDefault();
      ajustar((e) => ({ ...e, zoom: e.zoom * Math.exp(-ev.deltaY * 0.0015) }));
    };
    canvas.addEventListener("wheel", rueda, { passive: false });
    return () => canvas.removeEventListener("wheel", rueda);
  }, [acomodando, ajustar]);

  /**
   * Achica o agranda la foto para que el auto quede en la zona libre. En las fotos
   * de autos el auto ocupa más o menos la franja del medio, así que esa franja es
   * la que se ajusta a la zona; el cielo y el piso pueden quedar detrás del texto.
   */
  const encajar = () => {
    const zona = zonaRef.current;
    if (!foto || !zona) return;
    const base = rectFoto(foto, ENCUADRE_INICIAL);
    const alto = (zona.abajo - zona.arriba) / FRANJA_DEL_AUTO;
    const zoom = Math.min(ANCHO / base.w, alto / base.h);
    const centroBase = base.y + base.h / 2;
    ajustar(() => ({ zoom, x: 0, y: (zona.arriba + zona.abajo) / 2 - centroBase }));
  };

  const escala = () => ANCHO / (canvasRef.current?.getBoundingClientRect().width || ANCHO);

  const distanciaPunteros = () => {
    const [a, b] = [...punteros.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };

  const tocar = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!acomodando || !foto) return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    punteros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    pellizco.current = punteros.current.size === 2 ? { distancia: distanciaPunteros(), zoom: encuadre.zoom } : null;
  };

  const arrastrar = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const antes = punteros.current.get(ev.pointerId);
    if (!antes) return;
    punteros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const k = escala();
    const dx = (ev.clientX - antes.x) * k;
    const dy = (ev.clientY - antes.y) * k;
    if (punteros.current.size === 1) {
      ajustar((e) => ({ ...e, x: e.x + dx, y: e.y + dy }));
    } else if (punteros.current.size === 2 && pellizco.current) {
      // Con dos dedos: la distancia entre ellos acerca o aleja y el punto medio corre la foto.
      const base = pellizco.current;
      const zoom = (base.zoom * distanciaPunteros()) / base.distancia;
      ajustar((e) => ({ x: e.x + dx / 2, y: e.y + dy / 2, zoom }));
    }
  };

  const soltar = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    punteros.current.delete(ev.pointerId);
    pellizco.current = null;
  };

  const obtenerArchivo = () =>
    new Promise<File | null>((resolve) =>
      canvasRef.current?.toBlob(
        (b) => resolve(b ? new File([b], `${nombreArchivo}.jpg`, { type: "image/jpeg" }) : null),
        "image/jpeg",
        0.92
      )
    );

  const descargar = async () => {
    const file = await obtenerArchivo();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compartir = async () => {
    const file = await obtenerArchivo();
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: textos.epigrafe });
        return;
      } catch {
        return; // el usuario canceló
      }
    }
    descargar();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
      <div className="grid gap-3 lg:sticky lg:top-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={ANCHO}
            height={ALTO}
            onPointerDown={tocar}
            onPointerMove={arrastrar}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            aria-label={acomodando ? "Posteo: arrastrá la foto para acomodarla" : "Vista previa del posteo"}
            className={cn(
              "bg-muted aspect-[4/5] w-full rounded-2xl shadow-xl",
              acomodando && "ring-gold cursor-grab touch-none ring-4 active:cursor-grabbing"
            )}
          />
          {acomodando && (
            <canvas ref={guiaRef} width={ANCHO} height={ALTO} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
          )}
          {acomodando && (
            <p className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/70 px-3 py-1.5 text-center text-xs font-medium text-white">
              Arrastrá la foto · con dos dedos la achicás o agrandás
            </p>
          )}
        </div>
        {acomodando ? (
          <div className="bg-card grid gap-3 rounded-2xl border p-3">
            <label className="grid gap-1.5 text-sm">
              <span className="text-muted-foreground text-xs font-semibold">Tamaño de la foto</span>
              <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.01}
                value={encuadre.zoom}
                onChange={(e) => ajustar((x) => ({ ...x, zoom: Number(e.target.value) }))}
                className="accent-gold w-full"
              />
            </label>
            <Button type="button" variant="outline" className="h-11" onClick={encajar}>
              <SquareDashed className="size-4" /> Encajar en la zona libre
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-11" onClick={() => setEncuadre(ENCUADRE_INICIAL)}>
                <Crosshair className="size-4" /> Como al principio
              </Button>
              <Button type="button" className="h-11" onClick={() => setAcomodando(false)}>
                <Check className="size-4" /> Listo
              </Button>
            </div>
          </div>
        ) : (
          fotoSrc && (
            <Button type="button" variant="outline" className="h-11" onClick={() => setAcomodando(true)} disabled={!listo}>
              <Move className="size-4" /> Acomodar la foto
            </Button>
          )
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" size="lg" className="h-12" onClick={compartir} disabled={!listo}>
            {listo ? <Share2 className="size-4" /> : <Loader2 className="size-4 animate-spin" />} Compartir
          </Button>
          <Button type="button" size="lg" variant="outline" className="h-12" onClick={descargar} disabled={!listo}>
            <Download className="size-4" /> Descargar
          </Button>
        </div>
        <p className="text-muted-foreground text-center text-xs">
          En el celular, &quot;Compartir&quot; te deja mandarlo directo a Instagram o WhatsApp.
        </p>
      </div>

      <div className="grid content-start gap-5">
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Tipo de posteo</h2>
          <div className="flex flex-wrap gap-2">
            {plantillas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => elegirPlantilla(p)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  plantillaId === p.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                )}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Foto</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {[...(fotoPropia ? [{ id: "propia", src: fotoPropia }] : []), ...fotos].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => elegirFoto(f.src)}
                className={cn(
                  "aspect-square overflow-hidden rounded-lg border-2",
                  fotoSrc === f.src ? "border-gold ring-gold/30 ring-4" : "border-transparent"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} alt="" className="size-full object-cover" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border-input hover:bg-accent text-muted-foreground flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-[11px]"
            >
              <ImagePlus className="size-5" />
              Otra foto
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = URL.createObjectURL(f);
              setFotoPropia(url);
              elegirFoto(url);
              e.target.value = "";
            }}
          />
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold">Textos</h2>
          <Campo label="Línea chica de arriba" htmlFor="p-ante">
            <Entrada id="p-ante" value={textos.antetitulo} onChange={(e) => setTextos({ ...textos, antetitulo: e.target.value })} />
          </Campo>
          <Campo label="Título" htmlFor="p-titulo">
            <Entrada id="p-titulo" value={textos.titulo} onChange={(e) => setTextos({ ...textos, titulo: e.target.value })} />
          </Campo>
          <p className="text-muted-foreground text-xs">
            Lo que pongas entre *asteriscos* sale en negrita, por ejemplo el nombre del comprador.
          </p>
          <Campo label="Detalle" htmlFor="p-detalle">
            <AreaTexto id="p-detalle" rows={3} value={textos.detalle} onChange={(e) => setTextos({ ...textos, detalle: e.target.value })} />
          </Campo>
          <Campo label="Texto de abajo" htmlFor="p-pie">
            <Entrada id="p-pie" value={textos.pie} onChange={(e) => setTextos({ ...textos, pie: e.target.value })} />
          </Campo>
        </section>

        <section className="grid gap-2">
          <h2 className="text-sm font-semibold">Descripción para el posteo</h2>
          <AreaTexto rows={5} value={textos.epigrafe} onChange={(e) => setTextos({ ...textos, epigrafe: e.target.value })} />
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={async () => {
              await navigator.clipboard.writeText(textos.epigrafe);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }}
          >
            {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar descripción"}
          </Button>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Dibujo en canvas                                                          */
/* ------------------------------------------------------------------------ */

function cargarImagen(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function familiaMarca() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-montserrat").trim();
  return v || "Montserrat, Arial, sans-serif";
}

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

let logoCargado: Promise<HTMLImageElement | null> | null = null;

async function cargarRecursos(src: string | null): Promise<Recursos> {
  const fam = familiaMarca();
  await Promise.all([
    document.fonts.load(`800 80px ${fam}`),
    document.fonts.load(`500 36px ${fam}`),
    document.fonts.load(`400 44px ${fam}`),
    document.fonts.load(`700 44px ${fam}`),
  ]).catch(() => undefined);
  logoCargado ??= cargarImagen(MARCA.logoEscudo).catch(() => null);
  const [foto, logo] = await Promise.all([src ? cargarImagen(src).catch(() => null) : Promise.resolve(null), logoCargado]);
  return { src, foto, logo, fam };
}

/** Foto horizontal: el recorte vertical cortaría el auto, así que va entera sobre la misma foto desenfocada. */
function esHorizontal(foto: HTMLImageElement) {
  return foto.width / foto.height > 1.05;
}

/** Dónde se dibuja la foto (la principal, no el fondo desenfocado) según el encuadre. */
function rectFoto(foto: HTMLImageElement, e: Encuadre) {
  if (!esHorizontal(foto)) {
    // A sangre (object-fit: cover), corrida y acercada.
    const s = Math.max(ANCHO / foto.width, ALTO / foto.height) * e.zoom;
    const w = foto.width * s;
    const h = foto.height * s;
    return { x: (ANCHO - w) / 2 + e.x, y: (ALTO - h) / 2 + e.y, w, h };
  }
  // A todo el ancho, entre el recuadro de arriba (~330px) y el texto + escudo de abajo (~340px).
  const h0 = (foto.height / foto.width) * ANCHO;
  const centro = Math.max(330, Math.min(ALTO * 0.56 - h0 / 2 + 40, ALTO - h0 - 340)) + h0 / 2;
  const w = ANCHO * e.zoom;
  const h = h0 * e.zoom;
  return { x: (ANCHO - w) / 2 + e.x, y: centro - h / 2 + e.y, w, h };
}

/**
 * Mantiene el encuadre dentro de lo razonable: si la foto es más grande que el
 * posteo no deja bordes vacíos, y si es más chica no deja que se salga.
 */
function limitar(e: Encuadre, foto: HTMLImageElement): Encuadre {
  const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, e.zoom));
  const r = rectFoto(foto, { x: 0, y: 0, zoom });
  const eje = (corrimiento: number, inicio: number, tam: number, total: number) => {
    const min = Math.min(0, total - tam) - inicio;
    const max = Math.max(0, total - tam) - inicio;
    return Math.min(max, Math.max(min, corrimiento));
  };
  return { zoom, x: eje(e.x, r.x, r.w, ANCHO), y: eje(e.y, r.y, r.h, ALTO) };
}

/** Recuadro punteado (solo en pantalla, no sale en la imagen) que marca dónde conviene poner el auto. */
function dibujarGuia(canvas: HTMLCanvasElement | null, zona: ZonaLibre | null) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, ANCHO, ALTO);
  if (!zona) return;
  ctx.save();
  ctx.setLineDash([22, 16]);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(212,173,85,0.95)";
  rectRedondeado(ctx, 40, zona.arriba, ANCHO - 80, zona.abajo - zona.arriba, 28);
  ctx.stroke();
  ctx.font = `700 34px ${familiaMarca()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const texto = "Zona libre para el auto";
  const w = ctx.measureText(texto).width + 48;
  ctx.fillStyle = "rgba(212,173,85,0.95)";
  rectRedondeado(ctx, (ANCHO - w) / 2, zona.arriba - 26, w, 52, 26);
  ctx.fill();
  ctx.fillStyle = "#111f2e";
  ctx.fillText(texto, ANCHO / 2, zona.arriba);
  ctx.restore();
}

function dibujar(
  canvas: HTMLCanvasElement | null,
  { foto, logo, fam }: Recursos,
  t: Pick<PlantillaPosteo, "antetitulo" | "titulo" | "detalle" | "pie">,
  encuadre: Encuadre
): ZonaLibre | null {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return null;

  // Fondo + foto
  ctx.fillStyle = `rgb(${AZUL})`;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  if (foto) {
    const r = rectFoto(foto, encuadre);
    const llena = r.x <= 0.5 && r.y <= 0.5 && r.x + r.w >= ANCHO - 0.5 && r.y + r.h >= ALTO - 0.5;
    if (llena) {
      ctx.drawImage(foto, r.x, r.y, r.w, r.h);
    } else {
      // La foto no llega a cubrir el posteo: de fondo va la misma foto desenfocada.
      const s = Math.max(ANCHO / foto.width, ALTO / foto.height);
      const w = foto.width * s;
      const h = foto.height * s;
      ctx.save();
      ctx.filter = "blur(28px) brightness(0.55)";
      ctx.drawImage(foto, (ANCHO - w) / 2 - 40, (ALTO - h) / 2 - 40, w + 80, h + 80);
      ctx.restore();
      // Si queda chica, con las puntas redondeadas para que se vea como una tarjeta.
      const radio = r.w < ANCHO - 1 ? 28 : 0;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 40;
      ctx.fillStyle = `rgb(${AZUL})`;
      rectRedondeado(ctx, r.x, r.y, r.w, r.h, radio);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();
      ctx.drawImage(foto, r.x, r.y, r.w, r.h);
      ctx.restore();
    }
  }

  // Marco: recuadro grande semitransparente, como en los posteos de la agencia.
  // Más oscuro arriba y abajo (donde va el texto) y casi transparente en el medio (el auto).
  const margen = 80;
  const xMarco = margen;
  const yMarco = 110;
  const anchoMarco = ANCHO - margen * 2;
  const altoMarco = ALTO - yMarco - 90;
  ctx.fillStyle = `rgba(${AZUL}, 0.18)`;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const tinte = ctx.createLinearGradient(0, yMarco, 0, yMarco + altoMarco);
  tinte.addColorStop(0, `rgba(${AZUL}, 0.86)`);
  tinte.addColorStop(0.3, `rgba(${AZUL}, 0.42)`);
  tinte.addColorStop(0.58, `rgba(${AZUL}, 0.3)`);
  tinte.addColorStop(0.78, `rgba(${AZUL}, 0.78)`);
  tinte.addColorStop(1, `rgba(${AZUL}, 0.92)`);
  ctx.fillStyle = tinte;
  rectRedondeado(ctx, xMarco, yMarco, anchoMarco, altoMarco, 36);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const anchoTexto = anchoMarco - 90;
  const centro = ANCHO / 2;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";

  // Arriba: antetítulo, título grande y detalle
  let y = yMarco + 56;
  if (t.antetitulo) {
    y = escribirRico(ctx, t.antetitulo, { fam, tam: 56, peso: 500, alto: 64, max: 1 }, centro, y, anchoTexto);
    y += 4;
  }
  y = escribirRico(ctx, t.titulo, { fam, tam: 96, peso: 800, alto: 104, max: 2 }, centro, y, anchoTexto);
  if (t.detalle) {
    y += 14;
    ctx.globalAlpha = 0.95;
    y = escribirRico(ctx, t.detalle, { fam, tam: 40, peso: 500, alto: 50, max: 4 }, centro, y, anchoTexto);
    ctx.globalAlpha = 1;
  }

  // Abajo: escudo y mensaje (los nombres entre *asteriscos* van en negrita)
  const anchoLogo = 230;
  const altoLogo = logo ? (logo.height / logo.width) * anchoLogo : 0;
  const yLogo = yMarco + altoMarco - 50 - altoLogo;
  if (logo) ctx.drawImage(logo, (ANCHO - anchoLogo) / 2, yLogo, anchoLogo, altoLogo);
  let yPie = yLogo;
  if (t.pie) {
    const estilo = { fam, tam: 44, peso: 400, alto: 54, max: 3 };
    const lineas = lineasRicas(ctx, t.pie, estilo, anchoTexto);
    yPie = yLogo - 34 - lineas.length * estilo.alto;
    escribirRico(ctx, t.pie, estilo, centro, yPie, anchoTexto);
  }
  return { arriba: y + 36, abajo: yPie - 30 };
}

/* Texto con partes en negrita: "Felicitaciones *Juan Pérez* por su nueva adquisición" */

interface EstiloTexto {
  fam: string;
  tam: number;
  peso: number;
  alto: number;
  max: number;
}

type Trozo = { texto: string; negrita: boolean };

function fuente(e: EstiloTexto, negrita: boolean) {
  return `${negrita ? Math.max(e.peso, 700) : e.peso} ${e.tam}px ${e.fam}`;
}

/** Corta el texto en líneas de palabras, cada una con su peso, sin pasarse del ancho. */
function lineasRicas(ctx: CanvasRenderingContext2D, texto: string, e: EstiloTexto, ancho: number) {
  const lineas: Trozo[][] = [];
  const espacio = (negrita: boolean) => {
    ctx.font = fuente(e, negrita);
    return ctx.measureText(" ").width;
  };
  for (const parrafo of texto.split("\n")) {
    const palabras: Trozo[] = [];
    parrafo.split("*").forEach((parte, i) => {
      for (const p of parte.split(/\s+/).filter(Boolean)) palabras.push({ texto: p, negrita: i % 2 === 1 });
    });
    let actual: Trozo[] = [];
    let anchoActual = 0;
    for (const p of palabras) {
      ctx.font = fuente(e, p.negrita);
      const w = ctx.measureText(p.texto).width;
      const sep = actual.length ? espacio(p.negrita) : 0;
      if (actual.length && anchoActual + sep + w > ancho) {
        lineas.push(actual);
        actual = [p];
        anchoActual = w;
      } else {
        actual.push(p);
        anchoActual += sep + w;
      }
    }
    if (actual.length) lineas.push(actual);
  }
  return lineas.slice(0, e.max);
}

/** Escribe el texto centrado en `cx` desde `y` y devuelve la altura donde terminó. */
function escribirRico(ctx: CanvasRenderingContext2D, texto: string, e: EstiloTexto, cx: number, y: number, ancho: number) {
  const lineas = lineasRicas(ctx, texto, e, ancho);
  ctx.textAlign = "left";
  for (const linea of lineas) {
    const medidas = linea.map((p, i) => {
      ctx.font = fuente(e, p.negrita);
      return { w: ctx.measureText(p.texto).width, sep: i ? ctx.measureText(" ").width : 0 };
    });
    const total = medidas.reduce((a, m) => a + m.w + m.sep, 0);
    let x = cx - total / 2;
    linea.forEach((p, i) => {
      ctx.font = fuente(e, p.negrita);
      x += medidas[i].sep;
      ctx.fillText(p.texto, x, y);
      x += medidas[i].w;
    });
    y += e.alto;
  }
  ctx.textAlign = "center";
  return y;
}
