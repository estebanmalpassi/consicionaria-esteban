"use client";

import * as React from "react";
import { Check, Copy, Download, ImagePlus, Loader2, Share2 } from "lucide-react";

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
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [plantillaId, setPlantillaId] = React.useState(plantillas[0].id);
  const [textos, setTextos] = React.useState(() => ({ ...plantillas[0] }));
  const [fotoSrc, setFotoSrc] = React.useState<string | null>(fotos[0]?.src ?? null);
  const [fotoPropia, setFotoPropia] = React.useState<string | null>(null);
  // Clave de lo último que terminó de dibujarse; los botones se habilitan cuando coincide con lo actual.
  const [dibujado, setDibujado] = React.useState<string | null>(null);
  const [copiado, setCopiado] = React.useState(false);

  const elegirPlantilla = (p: PlantillaPosteo) => {
    setPlantillaId(p.id);
    setTextos({ ...p });
  };

  const clave = `${fotoSrc}|${textos.antetitulo}|${textos.titulo}|${textos.detalle}|${textos.pie}`;
  const listo = dibujado === clave;

  React.useEffect(() => {
    let cancelado = false;
    dibujar(canvasRef.current, fotoSrc, textos).then(() => {
      if (!cancelado) setDibujado(clave);
    });
    return () => {
      cancelado = true;
    };
  }, [fotoSrc, textos, clave]);

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
        <canvas
          ref={canvasRef}
          width={ANCHO}
          height={ALTO}
          className="bg-muted aspect-[4/5] w-full rounded-2xl shadow-xl"
        />
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
                onClick={() => setFotoSrc(f.src)}
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
              setFotoSrc(url);
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

async function dibujar(
  canvas: HTMLCanvasElement | null,
  fotoSrc: string | null,
  t: Pick<PlantillaPosteo, "antetitulo" | "titulo" | "detalle" | "pie">
) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const fam = familiaMarca();
  await Promise.all([
    document.fonts.load(`800 80px ${fam}`),
    document.fonts.load(`500 36px ${fam}`),
    document.fonts.load(`400 44px ${fam}`),
    document.fonts.load(`700 44px ${fam}`),
  ]).catch(() => undefined);
  const [foto, logo] = await Promise.all([
    fotoSrc ? cargarImagen(fotoSrc).catch(() => null) : Promise.resolve(null),
    cargarImagen(MARCA.logoEscudo).catch(() => null),
  ]);

  // Fondo + foto a sangre (object-fit: cover)
  ctx.fillStyle = `rgb(${AZUL})`;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  if (foto) {
    const escala = Math.max(ANCHO / foto.width, ALTO / foto.height);
    const w = foto.width * escala;
    const h = foto.height * escala;
    const horizontal = foto.width / foto.height > 1.05;
    if (!horizontal) {
      ctx.drawImage(foto, (ANCHO - w) / 2, (ALTO - h) / 2, w, h);
    } else {
      // Foto horizontal: el recorte vertical cortaría el auto. Se usa la misma foto
      // desenfocada de fondo y encima la foto entera, a todo el ancho.
      ctx.save();
      ctx.filter = "blur(28px) brightness(0.55)";
      ctx.drawImage(foto, (ANCHO - w) / 2 - 40, (ALTO - h) / 2 - 40, w + 80, h + 80);
      ctx.restore();
      const hFoto = (foto.height / foto.width) * ANCHO;
      // Entre el recuadro de arriba (~330px) y el texto + escudo de abajo (~340px)
      const yFoto = Math.max(330, Math.min(ALTO * 0.56 - hFoto / 2 + 40, ALTO - hFoto - 340));
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 40;
      ctx.drawImage(foto, 0, yFoto, ANCHO, hFoto);
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
    escribirRico(ctx, t.detalle, { fam, tam: 40, peso: 500, alto: 50, max: 4 }, centro, y, anchoTexto);
    ctx.globalAlpha = 1;
  }

  // Abajo: escudo y mensaje (los nombres entre *asteriscos* van en negrita)
  const anchoLogo = 230;
  const altoLogo = logo ? (logo.height / logo.width) * anchoLogo : 0;
  const yLogo = yMarco + altoMarco - 50 - altoLogo;
  if (logo) ctx.drawImage(logo, (ANCHO - anchoLogo) / 2, yLogo, anchoLogo, altoLogo);
  if (t.pie) {
    const estilo = { fam, tam: 44, peso: 400, alto: 54, max: 3 };
    const lineas = lineasRicas(ctx, t.pie, estilo, anchoTexto);
    escribirRico(ctx, t.pie, estilo, centro, yLogo - 34 - lineas.length * estilo.alto, anchoTexto);
  }
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
