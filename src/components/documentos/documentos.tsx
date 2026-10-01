import * as React from "react";

import { FORMA_PAGO_LABELS, numeroRecibo } from "@/lib/sales/comprobantes";
import { montoALetras } from "@/lib/sales/numero-a-letras";
import { MESES, fechaContrato, fechaCorta, totalesOperacion, type OperacionCompleta } from "@/lib/sales/operacion";
import { formatArs, formatKm } from "@/lib/utils";
import { MARCA } from "@/lib/marca";

type Op = OperacionCompleta;
type Persona = NonNullable<Op["seller"]>;

/** Hoja A4. En pantalla se ve como papel; al imprimir ocupa la página completa. */
export function Hoja({ children, className = "", pie }: { children: React.ReactNode; className?: string; pie?: React.ReactNode }) {
  return (
    <article
      className={`hoja mx-auto flex w-full max-w-[210mm] flex-col bg-white p-[6mm] sm:p-[14mm] font-serif text-[11pt] leading-relaxed text-neutral-900 shadow-lg ring-1 ring-black/5 print:min-h-[268mm] print:max-w-none print:p-0 print:text-[9.5pt] print:leading-snug print:shadow-none print:ring-0`}
    >
      <div className={className}>{children}</div>
      {pie}
    </article>
  );
}

/** Pie de marca: dirección de la agencia y eslogan, al final de cada hoja. */
function PieMarca({ op }: { op: Op }) {
  const d = op.dealership;
  const direccion = [d.addressStreet, d.addressCity, d.province].filter(Boolean).join(", ");
  return (
    <footer className="mt-auto flex items-center justify-center gap-2 border-t border-neutral-200 pt-3 font-sans text-[9px] tracking-wide text-neutral-500 uppercase">
      <span>{direccion}</span>
      <span className="text-[#b8923b]">◆</span>
      <span>{MARCA.eslogan}</span>
      {d.phone && (
        <>
          <span className="text-[#b8923b]">◆</span>
          <span>Tel. {d.phone}</span>
        </>
      )}
    </footer>
  );
}

function Membrete({ op, titulo, derecha }: { op: Op; titulo: string; derecha?: React.ReactNode }) {
  const d = op.dealership;
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 print:flex-nowrap border-b-2 border-[#b8923b] pb-3 font-sans print:mb-4">
      <div className="flex min-w-0 items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARCA.logoEscudo} alt="" className="h-12 w-auto shrink-0" />
        <div>
        <p className="text-lg font-bold">{d.tradeName}</p>
        <p className="text-xs text-neutral-600">
          {d.legalName} · CUIT {d.cuit}
          <br />
          {[d.addressStreet, d.addressCity, d.province].filter(Boolean).join(", ")}
          {d.phone ? ` · Tel. ${d.phone}` : ""}
        </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tracking-wide uppercase">{titulo}</p>
        {derecha}
      </div>
    </header>
  );
}

function descripcionAuto(v: Op["vehicle"]) {
  return `${v.brand} ${v.model}${v.version ? ` ${v.version}` : ""}`;
}

function nombreVendedor(op: Op) {
  return op.seller ? op.seller.fullName : op.dealership.legalName;
}

function identificacion(p: Persona) {
  return `${p.docType} N° ${p.docNumber}`;
}

function domicilio(p: { address: string | null; city: string | null; province: string | null }) {
  return [p.address, p.city, p.province].filter(Boolean).join(", ") || "____________________";
}

function Firmas({ izquierda, derecha }: { izquierda: string; derecha: string }) {
  return (
    <div className="mt-16 grid grid-cols-2 gap-16 print:mt-12 text-center font-sans text-xs break-inside-avoid">
      {[izquierda, derecha].map((t) => (
        <div key={t}>
          <div className="mb-1 border-t border-neutral-800" />
          <p className="font-semibold uppercase">{t}</p>
          <p className="text-neutral-500">Firma · Aclaración · DNI</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Boleto de compraventa (mismo formato y cláusulas que el formulario que     */
/* usa la agencia, con los espacios en blanco ya completos)                  */
/* ------------------------------------------------------------------------ */

const GASTOS_A_CARGO = {
  COMPRADOR: "el/los COMPRADOR/ES",
  VENDEDOR: "el/los VENDEDOR/ES",
  AMBOS: "ambas partes en partes iguales",
} as const;

/** Dato completado sobre la línea, como en el boleto en papel. */
function Linea({ children, mono }: { children?: React.ReactNode; mono?: boolean }) {
  return children ? (
    <b className={`border-b border-dotted border-neutral-500 px-0.5 ${mono ? "font-mono" : ""}`}>{children}</b>
  ) : (
    <span className="text-neutral-400">______________</span>
  );
}

function ParteBoleto({ p, rol }: { p: { nombre: string; doc: string; nacionalidad?: string | null; estadoCivil?: string | null; calle?: string | null; ciudad?: string | null; provincia?: string | null }; rol: string }) {
  return (
    <>
      el/los señor/es <Linea>{p.nombre}</Linea>, doc. de ident. nº <Linea>{p.doc}</Linea>, de nacionalidad{" "}
      <Linea>{p.nacionalidad}</Linea>, de estado civil <Linea>{p.estadoCivil}</Linea>, domiciliado/s en calle{" "}
      <Linea>{p.calle}</Linea> de <Linea>{p.ciudad}</Linea>, Pcia. de <Linea>{p.provincia}</Linea>, en su carácter de{" "}
      <b>{rol}</b>
    </>
  );
}

export function Boleto({ op }: { op: Op }) {
  const v = op.vehicle;
  const d = op.dealership;
  const { precio, permuta } = totalesOperacion(op);
  const sena = Number(op.depositArs);
  const saldo = Math.max(precio - permuta - sena, 0);
  const fecha = new Date(op.saleDate);
  const b = op.buyer;

  const vendedor = op.seller
    ? {
        nombre: op.seller.fullName,
        doc: `${op.seller.docType} ${op.seller.docNumber}`,
        nacionalidad: op.seller.nationality,
        estadoCivil: op.seller.maritalStatus,
        calle: op.seller.address,
        ciudad: op.seller.city,
        provincia: op.seller.province,
      }
    : {
        nombre: `${d.legalName} (${d.tradeName})`,
        doc: `CUIT ${d.cuit}`,
        nacionalidad: "argentina",
        estadoCivil: "—",
        calle: d.addressStreet,
        ciudad: d.addressCity,
        provincia: d.province,
      };

  const condiciones: string[] = [];
  if (sena > 0) condiciones.push(`En este acto la suma de ${formatArs(sena)} (${montoALetras(sena).toLowerCase()}) en concepto de seña y a cuenta de precio.`);
  if (permuta > 0)
    condiciones.push(
      `${formatArs(permuta)} mediante la entrega en parte de pago de ${op.tradeInDescription ?? "un automotor"}${op.tradeInPatente ? `, dominio ${op.tradeInPatente}` : ""}.`
    );
  if (saldo > 0)
    condiciones.push(
      `El saldo de ${formatArs(saldo)} (${montoALetras(saldo).toLowerCase()}) mediante ${FORMA_PAGO_LABELS[op.paymentMethod].toLowerCase()}${op.paymentNotes ? `: ${op.paymentNotes}` : ""}.`
    );
  if (condiciones.length === 0) condiciones.push(`Pago total en este acto mediante ${FORMA_PAGO_LABELS[op.paymentMethod].toLowerCase()}.`);

  const gastos = GASTOS_A_CARGO[(op.transferCostsBy ?? "COMPRADOR") as keyof typeof GASTOS_A_CARGO] ?? GASTOS_A_CARGO.COMPRADOR;
  const dias = op.transferDays ?? 10;

  return (
    <Hoja pie={<PieMarca op={op} />}>
      <Membrete op={op} titulo="Boleto compraventa" derecha={<p className="text-xs">Operación N° {op.number}</p>} />
      <h1 className="mb-4 text-center text-base font-bold tracking-widest print:mb-3">BOLETO COMPRAVENTA</h1>

      <div className="space-y-2.5 text-justify print:space-y-1.5">
        <p>
          En <Linea>{d.addressCity}</Linea>, provincia de <Linea>{d.province}</Linea>, departamento <Linea>{MARCA.departamento}</Linea>, a
          los <Linea>{fecha.getDate()}</Linea> días del mes de <Linea>{MESES[fecha.getMonth()]}</Linea> del año{" "}
          <Linea>{fecha.getFullYear()}</Linea>, entre <ParteBoleto p={vendedor} rol="VENDEDOR/ES" /> por una parte, y{" "}
          <ParteBoleto
            p={{ nombre: b.fullName, doc: `${b.docType} ${b.docNumber}`, nacionalidad: b.nationality, estadoCivil: b.maritalStatus, calle: b.address, ciudad: b.city, provincia: b.province }}
            rol="COMPRADOR/ES"
          />{" "}
          por la otra, convienen celebrar el presente boleto de COMPRA-VENTA que se regirá bajo las cláusulas que a continuación se
          detallan:
        </p>

        <p>
          <b>1º)</b> El/los señor/es <Linea>{vendedor.nombre}</Linea> Vende/n un/a <Linea>{v.bodyType ?? "automotor"}</Linea> Marca{" "}
          <Linea>{v.brand}</Linea> Modelo{" "}
          <Linea>
            {v.model}
            {v.version ? ` ${v.version}` : ""} {v.year}
          </Linea>{" "}
          Dominio del Registro Nacional del Automotor Nº <Linea mono>{v.patente}</Linea> dotado con motor Nº{" "}
          <Linea mono>{v.engineNumber}</Linea> y Chasis Nº <Linea mono>{v.vin}</Linea> libre de todo gravamen y en el estado de uso y
          conservación en que se encuentra previamente revisado por el comprador en la suma de pesos{" "}
          <Linea>{montoALetras(precio).replace(/^PESOS /, "").toLowerCase()}</Linea> (<Linea>{formatArs(precio)}</Linea>) bajo las
          condiciones de pago que se estipulan en el punto 2º) del presente Boleto de Compra-Venta.
        </p>

        <div>
          <p>
            <b>2º) CONDICIONES DE PAGO:</b>
          </p>
          <ul className="ml-6 list-disc">
            {condiciones.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <p>
          <b>3º)</b> El/los comprador/es acepta/n de plena conformidad la unidad en cesión objeto del presente Boleto Compra-Venta y las
          condiciones de pago establecidas, tomando plena posesión en este acto del vehículo y responsabilizándose en lo sucesivo de toda
          acción civil, material o criminal que pudiera ocurrirle, estando detenido o en circulación, con relación a cosas o animales.
        </p>

        <p>
          <b>4º)</b> Se deja establecido que el/los comprador/es deberán atender estrictamente las condiciones de pago fijadas en el punto
          2º) del presente Boleto de Compra-Venta, por cuanto en caso de incurrir en mora en cualquiera de las fechas indicadas en este
          boleto quedará &quot;ipso-facto&quot; rescindido, debiéndose reintegrar nuevamente la unidad al/los Vendedores quedando las sumas
          entregadas hasta ese momento como un simple alquiler de la misma.
        </p>

        <p>
          <b>5º)</b> Los gastos de transferencia ante el Registro Nac. del Automotor, Registro de Créditos Prendarios, Municipales, de
          Gestoría, y todo lo que surja objeto de la referida transferencia traslativa de dominio serán soportados por{" "}
          <Linea>{gastos}</Linea> quien se obliga a efectuarla dentro de los <Linea>{dias}</Linea> días, término dentro del cual el
          Vendedor entrega la documentación del automotor vendido, pero una vez transcurrido dicho término el vendedor no se responsabiliza
          por la negativa o reclamo que pudiere efectuar quien tiene inscripto el vehículo en el REGISTRO AUTOMOTOR, quedando autorizado
          por el solo vencimiento a efectuar denuncia de venta en el REGISTRO pertinente.
        </p>

        <p>
          <b>6º) OTRA:</b> {op.notes ? <Linea>{op.notes}</Linea> : <span className="text-neutral-400">—</span>}
        </p>

        <p>
          En prueba de conformidad se firman <Linea>dos (2)</Linea> ejemplares del presente de un mismo tenor y a un solo efecto los
          cuales obrarán en poder de las partes intervinientes en el lugar y fecha &quot;ut-supra&quot;.-
        </p>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-16 text-center font-sans text-xs break-inside-avoid print:mt-10">
        <div>
          <div className="mb-1 border-t border-neutral-800" />
          <p className="font-semibold">Firma de Comprador/es</p>
          <p className="text-neutral-600">Doc. Nº {b.docNumber}</p>
        </div>
        <div>
          <div className="mb-1 border-t border-neutral-800" />
          <p className="font-semibold">Firma de Vendedor/es</p>
          <p className="text-neutral-600">Doc. Nº {op.seller ? op.seller.docNumber : `CUIT ${d.cuit}`}</p>
        </div>
      </div>
    </Hoja>
  );
}

/* ------------------------------------------------------------------------ */
/* Recibo simple con membrete (original + duplicado en la misma hoja)        */
/* ------------------------------------------------------------------------ */

export function Recibo({ op, reciboId }: { op: Op; reciboId: string }) {
  const r = op.receipts.find((x) => x.id === reciboId);
  if (!r) return null;
  const v = op.vehicle;
  const acumulado = op.receipts.filter((x) => x.number <= r.number).reduce((a, x) => a + Number(x.amountArs), 0);
  const saldo = Math.max(Number(op.priceArs) - Number(op.tradeInValueArs ?? 0) - acumulado, 0);

  const cuerpo = (copia: string) => (
    <section className="flex flex-col break-inside-avoid">
      <Membrete
        op={op}
        titulo="Recibo"
        derecha={
          <>
            <p className="font-mono text-sm">{numeroRecibo(r.number)}</p>
            <p className="text-xs">Fecha: {fechaCorta(r.date)}</p>
            <p className="mt-1 text-[10px] font-semibold tracking-widest text-neutral-500">{copia}</p>
          </>
        }
      />
      <p className="text-justify text-[12pt] leading-loose print:text-[10.5pt]">
        Recibí de <b>{op.buyer.fullName}</b> la suma de <b>{montoALetras(Number(r.amountArs)).toLowerCase()}</b>{" "}
        <span className="rounded border border-neutral-800 px-2 py-0.5 font-sans font-bold whitespace-nowrap">
          {formatArs(Number(r.amountArs))}
        </span>{" "}
        en concepto de <b>{r.concept.toLowerCase()}</b> del {descripcionAuto(v)} {v.year}, dominio <b className="font-mono">{v.patente}</b>.
        {r.notes ? ` ${r.notes}.` : ""}
      </p>
      {saldo > 0 && <p className="mt-2 font-sans text-sm">Saldo pendiente: <b>{formatArs(saldo)}</b></p>}
      <div className="mt-10 ml-auto w-64 text-center font-sans text-xs">
        <div className="mb-1 border-t border-neutral-800" />
        <p className="font-semibold">p/ {op.dealership.tradeName}</p>
        <p className="text-neutral-500">Firma y aclaración</p>
      </div>
    </section>
  );

  return (
    <Hoja className="grid gap-8" pie={<PieMarca op={op} />}>
      {cuerpo("ORIGINAL")}
      <div className="border-t-2 border-dashed border-neutral-300 text-center font-sans text-[10px] text-neutral-400">✂ cortar aquí</div>
      {cuerpo("DUPLICADO")}
    </Hoja>
  );
}

/* ------------------------------------------------------------------------ */
/* Hoja de datos para el Formulario 08                                       */
/* ------------------------------------------------------------------------ */

export function DatosF08({ op }: { op: Op }) {
  const v = op.vehicle;
  const d = op.dealership;
  const vendedorFilas: [string, string][] = op.seller
    ? [
        ["Apellido y nombre", op.seller.fullName],
        ["Documento", identificacion(op.seller)],
        ["Nacionalidad", op.seller.nationality ?? ""],
        ["Estado civil", op.seller.maritalStatus ?? ""],
        ["Fecha de nacimiento", op.seller.birthDate ?? ""],
        ["Domicilio", domicilio(op.seller)],
        ["Código postal", op.seller.postalCode ?? ""],
      ]
    : [
        ["Razón social", d.legalName],
        ["CUIT", d.cuit],
        ["Domicilio", domicilio({ address: d.addressStreet, city: d.addressCity, province: d.province })],
        ["Código postal", d.postalCode ?? ""],
      ];
  const b = op.buyer;

  return (
    <Hoja className="font-sans text-[10pt] print:text-[8.5pt]" pie={<PieMarca op={op} />}>
      <Membrete op={op} titulo="Datos para Formulario 08" derecha={<p className="text-xs">Operación N° {op.number}</p>} />
      <p className="mb-4 rounded bg-neutral-100 p-2 text-xs">
        Hoja de ayuda con todos los datos que pide el Formulario 08 (o el 08 Digital). El formulario oficial se adquiere en el Registro
        Automotor o en dnrpa.gov.ar; las firmas deben certificarse ante escribano o el encargado del Registro.
      </p>
      <Tabla titulo="Automotor" filas={[
        ["Dominio", v.patente],
        ["Marca", v.brand],
        ["Modelo", `${v.model}${v.version ? ` ${v.version}` : ""}`],
        ["Tipo", v.bodyType ?? ""],
        ["Año modelo", String(v.year)],
        ["Marca y N° de motor", `${v.brand} ${v.engineNumber ?? ""}`],
        ["Marca y N° de chasis", `${v.brand} ${v.vin ?? ""}`],
        ["Uso", "Privado"],
      ]} />
      <Tabla titulo="Vendedor / titular (transmitente)" filas={vendedorFilas} />
      <Tabla titulo="Comprador (adquirente)" filas={[
        ["Apellido y nombre", b.fullName],
        ["Documento", identificacion(b)],
        ["Nacionalidad", b.nationality ?? ""],
        ["Estado civil", b.maritalStatus ?? ""],
        ["Fecha de nacimiento", b.birthDate ?? ""],
        ["Profesión", b.occupation ?? ""],
        ["Domicilio", domicilio(b)],
        ["Código postal", b.postalCode ?? ""],
        ["Teléfono / email", [b.phone, b.email].filter(Boolean).join(" · ")],
      ]} />
      <Tabla titulo="Operación" filas={[
        ["Precio de la operación", `${formatArs(Number(op.priceArs))} (${montoALetras(Number(op.priceArs)).toLowerCase()})`],
        ["Fecha", fechaCorta(op.saleDate)],
        ["Porcentaje que se transfiere", "100 %"],
      ]} />
    </Hoja>
  );
}

function Tabla({ titulo, filas }: { titulo: string; filas: [string, string][] }) {
  return (
    <table className="mb-4 print:mb-3 w-full border-collapse text-sm break-inside-avoid">
      <caption className="bg-neutral-800 px-2 py-1 text-left text-xs font-bold tracking-wide text-white uppercase">{titulo}</caption>
      <tbody>
        {filas.map(([k, v]) => (
          <tr key={k} className="border-b border-neutral-300">
            <th className="w-1/3 bg-neutral-50 px-2 py-1.5 print:py-[3px] text-left font-medium text-neutral-600">{k}</th>
            <td className="px-2 py-1.5 font-mono print:py-[3px]">{v || <span className="text-neutral-300">________________</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------------ */
/* Acta de entrega                                                           */
/* ------------------------------------------------------------------------ */

const ACCESORIOS = [
  "Dos juegos de llaves",
  "Manual del usuario",
  "Rueda de auxilio",
  "Gato y llave de rueda",
  "Matafuego",
  "Balizas",
  "Cédula de identificación",
  "VTV / RTO vigente",
];

export function ActaEntrega({ op }: { op: Op }) {
  const v = op.vehicle;
  const fecha = op.deliveryDate ?? null;
  return (
    <Hoja pie={<PieMarca op={op} />}>
      <Membrete op={op} titulo="Acta de entrega" derecha={<p className="text-xs">Operación N° {op.number}</p>} />
      <h1 className="mb-5 text-center text-base font-bold tracking-widest">ACTA DE ENTREGA DE VEHÍCULO</h1>
      <p className="text-justify">
        En la ciudad de {op.dealership.addressCity ?? "__________"}, {fecha ? fechaContrato(fecha) : "a los ____ días del mes de ________ de ____"},
        siendo las ____:____ horas, <b>{op.buyer.fullName}</b> ({identificacion(op.buyer)}) recibe de conformidad de{" "}
        <b>{nombreVendedor(op)}</b> el automotor {descripcionAuto(v)}, año {v.year}, dominio <b className="font-mono">{v.patente}</b>, con{" "}
        <b>{op.deliveryKm != null ? formatKm(op.deliveryKm) : "__________ km"}</b> en el odómetro.
      </p>
      <p className="mt-3 text-justify">
        A partir de este momento EL COMPRADOR asume la guarda del vehículo y la responsabilidad civil, penal y administrativa derivada de su
        uso, conforme a lo pactado en el boleto de compraventa.
      </p>
      <p className="mt-5 font-sans text-sm font-semibold">Se entrega con:</p>
      <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 font-sans text-sm">
        {ACCESORIOS.map((a) => (
          <li key={a} className="flex items-center gap-2">
            <span className="inline-block size-4 rounded-sm border border-neutral-700" /> {a}
          </li>
        ))}
      </ul>
      <p className="mt-5 font-sans text-sm font-semibold">Observaciones sobre el estado:</p>
      <div className="mt-2 space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-neutral-400" />
        ))}
      </div>
      <Firmas izquierda="Entrega" derecha="Recibe conforme" />
    </Hoja>
  );
}
