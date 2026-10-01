import * as React from "react";

import {
  CONDICION_IVA_LABELS,
  FORMA_PAGO_LABELS,
  TIPO_FACTURA_CODIGO,
  TIPO_FACTURA_LETRA,
  desglosarIva,
  numeroComprobante,
  type CondicionIva,
} from "@/lib/sales/comprobantes";
import { montoALetras } from "@/lib/sales/numero-a-letras";
import { fechaContrato, fechaCorta, totalesOperacion, type OperacionCompleta } from "@/lib/sales/operacion";
import { AFIP_CONDITION_LABELS } from "@/lib/validations/dealership";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/types/vehicle";
import { formatArs, formatKm } from "@/lib/utils";

type Op = OperacionCompleta;
type Persona = NonNullable<Op["seller"]>;

/** Hoja A4. En pantalla se ve como papel; al imprimir ocupa la página completa. */
export function Hoja({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <article
      className={`hoja mx-auto w-full max-w-[210mm] bg-white p-[14mm] font-serif text-[11pt] leading-relaxed text-neutral-900 shadow-lg ring-1 ring-black/5 print:max-w-none print:p-0 print:text-[9.5pt] print:leading-snug print:shadow-none print:ring-0 ${className}`}
    >
      {children}
    </article>
  );
}

function Membrete({ op, titulo, derecha }: { op: Op; titulo: string; derecha?: React.ReactNode }) {
  const d = op.dealership;
  return (
    <header className="mb-6 print:mb-4 flex items-start justify-between gap-4 border-b-2 border-neutral-800 pb-3 font-sans">
      <div>
        <p className="text-lg font-bold">{d.tradeName}</p>
        <p className="text-xs text-neutral-600">
          {d.legalName} · CUIT {d.cuit}
          <br />
          {[d.addressStreet, d.addressCity, d.province].filter(Boolean).join(", ")}
          {d.phone ? ` · Tel. ${d.phone}` : ""}
        </p>
      </div>
      <div className="text-right">
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
/* Boleto de compraventa                                                    */
/* ------------------------------------------------------------------------ */

export function Boleto({ op }: { op: Op }) {
  const v = op.vehicle;
  const d = op.dealership;
  const { precio, permuta } = totalesOperacion(op);
  const sena = Number(op.depositArs);
  const saldo = Math.max(precio - permuta - sena, 0);
  const ciudad = d.addressCity ?? "__________";

  const vendedor = op.seller ? (
    <>
      <b>{op.seller.fullName}</b>, {identificacion(op.seller)}
      {op.seller.nationality ? `, de nacionalidad ${op.seller.nationality.toLowerCase()}` : ""}
      {op.seller.maritalStatus ? `, estado civil ${op.seller.maritalStatus.toLowerCase()}` : ""}, con domicilio en{" "}
      {domicilio(op.seller)}
    </>
  ) : (
    <>
      <b>{d.legalName}</b> ({d.tradeName}), CUIT {d.cuit}, con domicilio en{" "}
      {domicilio({ address: d.addressStreet, city: d.addressCity, province: d.province })}
    </>
  );

  const b = op.buyer;

  return (
    <Hoja>
      <Membrete op={op} titulo="Boleto de compraventa" derecha={<p className="text-xs">Operación N° {op.number}</p>} />
      <h1 className="mb-5 text-center text-base font-bold tracking-widest">BOLETO DE COMPRAVENTA DE AUTOMOTOR</h1>

      <div className="space-y-3 text-justify print:space-y-2">
        <p>
          Entre {vendedor}, en adelante denominado <b>EL VENDEDOR</b>; y <b>{b.fullName}</b>, {identificacion(b)}
          {b.nationality ? `, de nacionalidad ${b.nationality.toLowerCase()}` : ""}
          {b.maritalStatus ? `, estado civil ${b.maritalStatus.toLowerCase()}` : ""}, con domicilio en {domicilio(b)}, en adelante
          denominado <b>EL COMPRADOR</b>; convienen en celebrar el presente boleto de compraventa, sujeto a las siguientes cláusulas:
        </p>

        <p>
          <b>PRIMERA – Objeto:</b> EL VENDEDOR vende y EL COMPRADOR adquiere el automotor marca <b>{v.brand}</b>, modelo{" "}
          <b>
            {v.model}
            {v.version ? ` ${v.version}` : ""}
          </b>
          , tipo {v.bodyType ?? "________"}, año <b>{v.year}</b>, dominio <b className="font-mono">{v.patente}</b>, motor N°{" "}
          <b className="font-mono">{v.engineNumber ?? "______________"}</b>, chasis N° <b className="font-mono">{v.vin ?? "______________"}</b>,
          color {v.color ?? "________"}, combustible {FUEL_LABELS[v.fuelType].toLowerCase()}, con {formatKm(v.mileageKm)} recorridos.
        </p>

        <p>
          <b>SEGUNDA – Precio:</b> El precio total y convenido es de <b>{montoALetras(precio)}</b> (<b>{formatArs(precio)}</b>), que se abona de
          la siguiente forma:
        </p>
        <ul className="ml-6 list-disc">
          {sena > 0 && (
            <li>
              En este acto la suma de {formatArs(sena)} ({montoALetras(sena).toLowerCase()}) en concepto de seña y a cuenta de precio, sirviendo el
              presente de suficiente recibo.
            </li>
          )}
          {permuta > 0 && (
            <li>
              La suma de {formatArs(permuta)} mediante la entrega en parte de pago del automotor {op.tradeInDescription ?? ""}
              {op.tradeInPatente ? `, dominio ${op.tradeInPatente}` : ""}, que EL COMPRADOR declara de su exclusiva propiedad y libre de
              gravámenes, deudas e inhibiciones.
            </li>
          )}
          {saldo > 0 && (
            <li>
              El saldo de {formatArs(saldo)} ({montoALetras(saldo).toLowerCase()}) mediante {FORMA_PAGO_LABELS[op.paymentMethod].toLowerCase()}
              {op.paymentNotes ? `: ${op.paymentNotes}` : ""}, a abonar antes o en el momento de la entrega del vehículo.
            </li>
          )}
          {sena === 0 && permuta === 0 && saldo === precio && op.paymentNotes && <li>{op.paymentNotes}</li>}
        </ul>

        <p>
          <b>TERCERA – Estado dominial:</b> EL VENDEDOR declara que el automotor es de su propiedad o que se encuentra facultado para su venta,
          y que se halla libre de prendas, embargos, inhibiciones y cualquier otro gravamen, haciéndose cargo de las deudas por patentes,
          multas e infracciones devengadas hasta la fecha de entrega de la posesión.
        </p>

        <p>
          <b>CUARTA – Estado del vehículo:</b> EL COMPRADOR declara haber revisado el automotor y recibirlo en el estado en que se encuentra,
          que conoce y acepta, sin perjuicio de las garantías que por ley correspondan.
        </p>

        <p>
          <b>QUINTA – Entrega y responsabilidad:</b> A partir de la entrega de la posesión, EL COMPRADOR asume la responsabilidad civil,
          penal y administrativa por el uso del vehículo, así como el pago de patentes, seguros, multas e infracciones posteriores.
        </p>

        <p>
          <b>SEXTA – Transferencia:</b> EL COMPRADOR se obliga a inscribir la transferencia a su nombre ante el Registro Nacional de la
          Propiedad del Automotor dentro de los diez (10) días hábiles de la firma del Formulario 08, siendo los gastos de transferencia a
          su exclusivo cargo. Vencido ese plazo, EL VENDEDOR queda facultado a efectuar la denuncia de venta correspondiente.
        </p>

        <p>
          <b>SÉPTIMA – Incumplimiento:</b> Si EL COMPRADOR no abonara el saldo en las condiciones pactadas, perderá la seña entregada. Si
          quien desistiera fuera EL VENDEDOR, deberá restituirla con más otro tanto, conforme al art. 1059 del Código Civil y Comercial.
        </p>

        {op.notes && (
          <p>
            <b>OCTAVA – Cláusulas particulares:</b> {op.notes}
          </p>
        )}

        <p>
          <b>{op.notes ? "NOVENA" : "OCTAVA"} – Jurisdicción:</b> Para todos los efectos legales, las partes constituyen domicilio en los
          indicados precedentemente y se someten a la jurisdicción de los tribunales ordinarios de {d.province ?? ciudad}, renunciando a
          cualquier otro fuero.
        </p>

        <p>
          En prueba de conformidad, se firman dos (2) ejemplares de un mismo tenor y a un solo efecto, en la ciudad de {ciudad},{" "}
          {fechaContrato(op.saleDate)}.
        </p>
      </div>

      <Firmas izquierda="El vendedor" derecha="El comprador" />
    </Hoja>
  );
}

/* ------------------------------------------------------------------------ */
/* Recibo (original + duplicado en la misma hoja)                            */
/* ------------------------------------------------------------------------ */

export function Recibo({ op, reciboId }: { op: Op; reciboId: string }) {
  const r = op.receipts.find((x) => x.id === reciboId);
  if (!r) return null;
  const v = op.vehicle;
  const acumulado = op.receipts.filter((x) => x.number <= r.number).reduce((a, x) => a + Number(x.amountArs), 0);
  const saldo = Math.max(Number(op.priceArs) - Number(op.tradeInValueArs ?? 0) - acumulado, 0);
  const numero = numeroComprobante(op.dealership.pointOfSale, r.number);

  const cuerpo = (copia: string) => (
    <section className="flex flex-col break-inside-avoid">
      <Membrete
        op={op}
        titulo="Recibo"
        derecha={
          <>
            <p className="font-mono text-sm">N° {numero}</p>
            <p className="text-xs">Fecha: {fechaCorta(r.date)}</p>
            <p className="mt-1 text-[10px] font-semibold tracking-widest text-neutral-500">{copia}</p>
          </>
        }
      />
      <p className="text-justify">
        Recibí de <b>{op.buyer.fullName}</b> ({identificacion(op.buyer)}) la suma de <b>{montoALetras(Number(r.amountArs))}</b>{" "}
        <span className="rounded border border-neutral-800 px-2 py-0.5 font-sans font-bold whitespace-nowrap">
          {formatArs(Number(r.amountArs))}
        </span>{" "}
        en concepto de <b>{r.concept.toLowerCase()}</b> del automotor {descripcionAuto(v)}, año {v.year}, dominio{" "}
        <b className="font-mono">{v.patente}</b>, abonado mediante {FORMA_PAGO_LABELS[r.method].toLowerCase()}.
        {r.notes ? ` ${r.notes}.` : ""}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 font-sans text-xs">
        <Dato k="Precio total" v={formatArs(Number(op.priceArs))} />
        <Dato k="Pagado a la fecha" v={formatArs(acumulado + Number(op.tradeInValueArs ?? 0))} />
        <Dato k="Saldo pendiente" v={formatArs(saldo)} fuerte />
      </div>
      <div className="mt-10 ml-auto w-64 text-center font-sans text-xs">
        <div className="mb-1 border-t border-neutral-800" />
        <p className="font-semibold">p/ {op.dealership.tradeName}</p>
        <p className="text-neutral-500">Firma y aclaración</p>
      </div>
    </section>
  );

  return (
    <Hoja className="grid gap-8">
      {cuerpo("ORIGINAL")}
      <div className="border-t-2 border-dashed border-neutral-300 text-center font-sans text-[10px] text-neutral-400">✂ cortar aquí</div>
      {cuerpo("DUPLICADO")}
    </Hoja>
  );
}

function Dato({ k, v, fuerte }: { k: string; v: string; fuerte?: boolean }) {
  return (
    <div className="rounded border border-neutral-300 px-2 py-1">
      <p className="text-[10px] text-neutral-500 uppercase">{k}</p>
      <p className={fuerte ? "font-bold" : ""}>{v}</p>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Factura (formato ARCA / ex AFIP)                                          */
/* ------------------------------------------------------------------------ */

export function Factura({ op }: { op: Op }) {
  const d = op.dealership;
  if (!op.invoiceType) {
    return (
      <Hoja>
        <Membrete op={op} titulo="Factura" />
        <p>
          En esta operación vende un particular ({op.seller?.fullName}). La venta entre particulares no lleva factura del auto: se instrumenta
          con el boleto de compraventa y el Formulario 08. La concesionaria factura sólo su comisión por la intermediación.
        </p>
      </Hoja>
    );
  }
  const letra = TIPO_FACTURA_LETRA[op.invoiceType];
  const total = Number(op.priceArs);
  const alicuota = Number(op.ivaRate);
  const { neto, iva } = desglosarIva(total, letra === "C" ? 0 : alicuota);
  const v = op.vehicle;
  const pendiente = !op.afipCae;

  return (
    <Hoja className="relative overflow-hidden font-sans text-[10pt]">
      {pendiente && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="-rotate-30 text-center text-4xl font-black tracking-widest text-red-500/15">
            BORRADOR
            <br />
            SIN CAE
          </p>
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] border-2 border-neutral-800">
        <div className="p-3">
          <p className="text-lg font-bold">{d.tradeName}</p>
          <p className="text-xs">
            <b>Razón social:</b> {d.legalName}
            <br />
            <b>Domicilio:</b> {[d.addressStreet, d.addressCity, d.province].filter(Boolean).join(", ")}
            <br />
            <b>Condición IVA:</b> {AFIP_CONDITION_LABELS[d.afipConditionIva as keyof typeof AFIP_CONDITION_LABELS] ?? d.afipConditionIva}
          </p>
        </div>
        <div className="flex flex-col items-center border-x-2 border-neutral-800 px-4 pt-1">
          <span className="text-5xl font-black">{letra}</span>
          <span className="text-[9px]">COD. {TIPO_FACTURA_CODIGO[op.invoiceType]}</span>
        </div>
        <div className="p-3 text-xs">
          <p className="text-lg font-bold">FACTURA</p>
          <p>
            <b>Punto de venta / N°:</b> <span className="font-mono">{numeroComprobante(d.pointOfSale, op.invoiceNumber)}</span>
            <br />
            <b>Fecha de emisión:</b> {fechaCorta(op.saleDate)}
            <br />
            <b>CUIT:</b> {d.cuit}
            <br />
            <b>Ingresos Brutos:</b> {d.grossIncomeNumber ?? "—"}
            <br />
            <b>Inicio de actividades:</b> {d.activityStartDate ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 border-2 border-neutral-800 p-3 text-xs">
        <p>
          <b>{op.buyer.docType}:</b> {op.buyer.docNumber}
        </p>
        <p>
          <b>Apellido y nombre / Razón social:</b> {op.buyer.fullName}
        </p>
        <p>
          <b>Condición frente al IVA:</b> {CONDICION_IVA_LABELS[op.buyer.ivaCondition as CondicionIva]}
        </p>
        <p>
          <b>Domicilio:</b> {domicilio(op.buyer)}
        </p>
        <p>
          <b>Condición de venta:</b> {FORMA_PAGO_LABELS[op.paymentMethod]}
        </p>
      </div>

      <table className="mt-2 w-full border-2 border-neutral-800 text-xs">
        <thead className="bg-neutral-100">
          <tr className="text-left">
            <th className="p-2">Descripción</th>
            <th className="p-2 text-right">Cant.</th>
            <th className="p-2 text-right">{letra === "A" ? "Precio neto" : "Precio"}</th>
            {letra === "A" && <th className="p-2 text-right">IVA</th>}
            <th className="p-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td className="p-2">
              Automotor {descripcionAuto(v)}, año {v.year}, dominio {v.patente}
              <br />
              <span className="text-neutral-600">
                Motor {v.engineNumber ?? "—"} · Chasis {v.vin ?? "—"} · {TRANSMISSION_LABELS[v.transmission]} · {formatKm(v.mileageKm)}
              </span>
            </td>
            <td className="p-2 text-right">1</td>
            <td className="p-2 text-right tabular-nums">{formatArs(letra === "A" ? neto : total)}</td>
            {letra === "A" && <td className="p-2 text-right">{alicuota}%</td>}
            <td className="p-2 text-right tabular-nums">{formatArs(letra === "A" ? neto : total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-2 ml-auto w-72 border-2 border-neutral-800 p-3 text-sm">
        {letra === "A" && (
          <>
            <Linea k="Importe neto gravado" v={formatArs(neto)} />
            <Linea k={`IVA ${alicuota}%`} v={formatArs(iva)} />
          </>
        )}
        <Linea k="Importe total" v={formatArs(total)} fuerte />
        {letra === "B" && alicuota > 0 && (
          <p className="mt-1 text-[10px] text-neutral-600">
            Régimen de Transparencia Fiscal al Consumidor (Ley 27.743): IVA contenido {formatArs(iva)}
          </p>
        )}
      </div>

      <p className="mt-2 text-xs">Son: {montoALetras(total)}</p>

      <div className="mt-4 flex items-end justify-between border-t-2 border-neutral-800 pt-2 text-xs">
        <div>
          <p>
            <b>CAE N°:</b> <span className="font-mono">{op.afipCae ?? "____________________"}</span>
          </p>
          <p>
            <b>Fecha de vto. de CAE:</b> {op.afipCaeExpiry ?? "__________"}
          </p>
        </div>
        <p className="max-w-64 text-right text-[10px] text-neutral-500">
          {pendiente
            ? "Comprobante no válido hasta obtener el CAE en ARCA (ex AFIP) y cargarlo en la operación."
            : "Comprobante autorizado por ARCA (ex AFIP)."}
        </p>
      </div>
    </Hoja>
  );
}

function Linea({ k, v, fuerte }: { k: string; v: string; fuerte?: boolean }) {
  return (
    <div className={`flex justify-between ${fuerte ? "border-t border-neutral-400 pt-1 font-bold" : ""}`}>
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
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
    <Hoja className="font-sans text-[10pt]">
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
            <th className="w-1/3 bg-neutral-50 px-2 py-1.5 print:py-1 text-left font-medium text-neutral-600">{k}</th>
            <td className="px-2 py-1.5 font-mono print:py-1">{v || <span className="text-neutral-300">________________</span>}</td>
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
    <Hoja>
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
