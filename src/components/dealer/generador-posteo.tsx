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

/** Corta el texto en líneas que entren en `ancho` (respeta los saltos de línea escritos). */
function partirLineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  const lineas: string[] = [];
  for (const parrafo of texto.split("\n")) {
    let actual = "";
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width > ancho && actual) {
        lineas.push(actual);
        actual = palabra;
      } else actual = prueba;
    }
    if (actual) lineas.push(actual);
  }
  return lineas;
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

  // Degradés para que el texto se lea sobre cualquier foto
  const arriba = ctx.createLinearGradient(0, 0, 0, ALTO * 0.45);
  arriba.addColorStop(0, `rgba(${AZUL}, 0.55)`);
  arriba.addColorStop(1, `rgba(${AZUL}, 0)`);
  ctx.fillStyle = arriba;
  ctx.fillRect(0, 0, ANCHO, ALTO * 0.45);
  const abajo = ctx.createLinearGradient(0, ALTO * 0.6, 0, ALTO);
  abajo.addColorStop(0, `rgba(${AZUL}, 0)`);
  abajo.addColorStop(1, `rgba(${AZUL}, 0.95)`);
  ctx.fillStyle = abajo;
  ctx.fillRect(0, ALTO * 0.6, ANCHO, ALTO * 0.4);

  // Recuadro superior con antetítulo, título y detalle
  const margen = 90;
  const anchoPanel = ANCHO - margen * 2;
  const anchoTexto = anchoPanel - 80;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.font = `800 82px ${fam}`;
  const lineasTitulo = partirLineas(ctx, t.titulo, anchoTexto).slice(0, 2);
  ctx.font = `500 34px ${fam}`;
  const lineasDetalle = partirLineas(ctx, t.detalle, anchoTexto).slice(0, 4);
  const altoAnte = t.antetitulo ? 50 : 0;
  const altoTitulo = lineasTitulo.length * 90;
  const altoDetalle = lineasDetalle.length ? 16 + lineasDetalle.length * 44 : 0;
  const altoPanel = 56 + altoAnte + altoTitulo + altoDetalle + 40;
  const yPanel = 100;

  ctx.fillStyle = `rgba(${AZUL}, 0.78)`;
  rectRedondeado(ctx, margen, yPanel, anchoPanel, altoPanel, 28);
  ctx.fill();

  let y = yPanel + 50;
  ctx.fillStyle = "#ffffff";
  if (t.antetitulo) {
    ctx.font = `500 38px ${fam}`;
    ctx.globalAlpha = 0.92;
    ctx.fillText(t.antetitulo, ANCHO / 2, y);
    ctx.globalAlpha = 1;
    y += altoAnte;
  }
  ctx.font = `800 82px ${fam}`;
  for (const l of lineasTitulo) {
    ctx.fillText(l, ANCHO / 2, y);
    y += 90;
  }
  if (lineasDetalle.length) {
    y += 16;
    ctx.font = `500 34px ${fam}`;
    ctx.globalAlpha = 0.9;
    for (const l of lineasDetalle) {
      ctx.fillText(l, ANCHO / 2, y);
      y += 44;
    }
    ctx.globalAlpha = 1;
  }

  // Escudo y texto de abajo
  const anchoLogo = 230;
  const altoLogo = logo ? (logo.height / logo.width) * anchoLogo : 0;
  const yLogo = ALTO - 60 - altoLogo;
  if (logo) ctx.drawImage(logo, (ANCHO - anchoLogo) / 2, yLogo, anchoLogo, altoLogo);
  if (t.pie) {
    ctx.font = `500 30px ${fam}`;
    const lineasPie = partirLineas(ctx, t.pie, ANCHO - 200).slice(0, 2);
    let yPie = yLogo - 28 - lineasPie.length * 40;
    ctx.fillStyle = "#ffffff";
    for (const l of lineasPie) {
      ctx.fillText(l, ANCHO / 2, yPie);
      yPie += 40;
    }
  }
}
