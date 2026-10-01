"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Car, Check, FileSignature, Loader2, Plus, User, Wallet } from "lucide-react";

import { crearOperacionAction } from "@/lib/actions/operaciones";
import { guardarVehiculoAction } from "@/lib/actions/vehiculos";
import { FORMA_PAGO_LABELS } from "@/lib/sales/comprobantes";
import { montoALetras } from "@/lib/sales/numero-a-letras";
import type { OperacionValues, PersonaValues } from "@/lib/validations/operacion";
import { cn, formatArs, formatKm } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AreaTexto, AvisoError, Campo, Entrada, EntradaPesos, Selector } from "@/components/dealer/campo";
import { CamposPersona, PERSONA_VACIA } from "@/components/dealer/campos-persona";
import { CamposVehiculo, formDataAVehiculo } from "@/components/dealer/formulario-vehiculo";

export interface AutoDisponible {
  id: string;
  patente: string;
  titulo: string;
  year: number;
  mileageKm: number;
  priceArs: number;
  color: string | null;
  engineNumber: string | null;
  vin: string | null;
  portada: string | null;
}

interface Concesionaria {
  tradeName: string;
  legalName: string;
  cuit: string;
  ciudad: string | null;
}

const PASOS = [
  { id: "auto", titulo: "Auto", icono: Car },
  { id: "vendedor", titulo: "Vendedor", icono: Building2 },
  { id: "comprador", titulo: "Comprador", icono: User },
  { id: "pago", titulo: "Precio y pago", icono: Wallet },
] as const;

const hoy = () => new Date().toISOString().slice(0, 10);

export function AsistenteOperacion({
  autos: autosIniciales,
  concesionaria,
  autoInicial,
}: {
  autos: AutoDisponible[];
  concesionaria: Concesionaria;
  autoInicial?: string;
}) {
  const router = useRouter();
  const [paso, setPaso] = React.useState(autoInicial ? 1 : 0);
  const [autos, setAutos] = React.useState(autosIniciales);
  const [vehicleId, setVehicleId] = React.useState(autoInicial ?? "");
  const [cargandoNuevo, setCargandoNuevo] = React.useState(autosIniciales.length === 0);
  const [vendeConcesionaria, setVendeConcesionaria] = React.useState(true);
  const [vendedor, setVendedor] = React.useState<PersonaValues>(PERSONA_VACIA);
  const [comprador, setComprador] = React.useState<PersonaValues>(PERSONA_VACIA);
  const auto = autos.find((a) => a.id === vehicleId);
  const [precio, setPrecio] = React.useState<number | null>(auto?.priceArs ?? null);
  const [sena, setSena] = React.useState<number | null>(null);
  const [formaPago, setFormaPago] = React.useState<OperacionValues["paymentMethod"]>("CONTADO");
  const [permuta, setPermuta] = React.useState({ descripcion: "", patente: "", valor: null as number | null });
  const [fecha, setFecha] = React.useState(hoy());
  const [gastosPor, setGastosPor] = React.useState<"COMPRADOR" | "VENDEDOR" | "AMBOS">("COMPRADOR");
  const [diasTransferencia, setDiasTransferencia] = React.useState("10");
  const [notasPago, setNotasPago] = React.useState("");
  const [clausulas, setClausulas] = React.useState("");
  const [error, setError] = React.useState<{ msg: string; field?: string } | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  const formAutoRef = React.useRef<HTMLFormElement>(null);

  const conPermuta = formaPago === "PERMUTA" || formaPago === "MIXTO";
  const saldo = (precio ?? 0) - (sena ?? 0) - (conPermuta ? permuta.valor ?? 0 : 0);

  const elegirAuto = (a: AutoDisponible) => {
    setVehicleId(a.id);
    setPrecio(a.priceArs);
  };

  const validarPaso = async (): Promise<boolean> => {
    setError(null);
    if (paso === 0) {
      if (cargandoNuevo) {
        const form = formAutoRef.current;
        if (!form || !form.reportValidity()) return false;
        const valores = formDataAVehiculo(new FormData(form));
        const res = await guardarVehiculoAction(valores);
        if (!res.ok || !res.data) {
          setError({ msg: res.error ?? "No se pudo guardar el auto.", field: res.field });
          return false;
        }
        const nuevo: AutoDisponible = {
          id: res.data.id,
          patente: String(valores.patente).toUpperCase().replace(/[\s-]/g, ""),
          titulo: `${valores.brand} ${valores.model} ${valores.version ?? ""}`.trim(),
          year: Number(valores.year),
          mileageKm: Number(valores.mileageKm),
          priceArs: Number(valores.priceArs),
          color: valores.color || null,
          engineNumber: valores.engineNumber || null,
          vin: valores.vin || null,
          portada: null,
        };
        setAutos((prev) => [nuevo, ...prev]);
        elegirAuto(nuevo);
        setCargandoNuevo(false);
        return true;
      }
      if (!vehicleId) {
        setError({ msg: "Elegí un auto del stock o cargá uno nuevo." });
        return false;
      }
    }
    if (paso === 1 && !vendeConcesionaria) {
      if (!vendedor.fullName || !vendedor.docNumber || !vendedor.address) {
        setError({ msg: "Completá nombre, documento y domicilio del vendedor." });
        return false;
      }
    }
    if (paso === 2) {
      if (!comprador.fullName || !comprador.docNumber || !comprador.address) {
        setError({ msg: "Completá nombre, documento y domicilio del comprador." });
        return false;
      }
    }
    return true;
  };

  const siguiente = async () => {
    setEnviando(true);
    const ok = await validarPaso();
    setEnviando(false);
    if (ok) setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  };

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    const res = await crearOperacionAction({
      vehicleId,
      sellerIsDealership: vendeConcesionaria,
      seller: vendeConcesionaria ? undefined : vendedor,
      buyer: comprador,
      priceArs: precio ?? 0,
      depositArs: sena ?? 0,
      paymentMethod: formaPago,
      paymentNotes: notasPago,
      tradeInDescription: conPermuta ? permuta.descripcion : "",
      tradeInPatente: conPermuta ? permuta.patente : "",
      tradeInValueArs: conPermuta ? permuta.valor ?? 0 : 0,
      transferCostsBy: gastosPor,
      transferDays: diasTransferencia,
      saleDate: fecha,
      notes: clausulas,
    });
    if (!res.ok || !res.data) {
      setEnviando(false);
      setError({ msg: res.error ?? "No se pudo crear la operación.", field: res.field });
      if (res.field?.startsWith("buyer")) setPaso(2);
      else if (res.field?.startsWith("seller")) setPaso(1);
      return;
    }
    router.push(`/dealer/operaciones/${res.data.id}?nueva=1`);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="grid min-w-0 grid-cols-1 gap-6">
        {/* Progreso */}
        <ol className="grid grid-cols-4 gap-2">
          {PASOS.map((p, i) => {
            const Icono = p.icono;
            const hecho = i < paso;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={i > paso}
                  onClick={() => setPaso(i)}
                  className="group flex w-full flex-col items-center gap-1.5 text-xs disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 transition",
                      i === paso && "border-primary bg-primary text-primary-foreground shadow-primary/30 shadow-lg",
                      hecho && "border-trust bg-trust-muted text-trust",
                      i > paso && "text-muted-foreground"
                    )}
                  >
                    {hecho ? <Check className="size-4" /> : <Icono className="size-4" />}
                  </span>
                  <span className={cn(i === paso ? "font-semibold" : "text-muted-foreground")}>{p.titulo}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div
            key={paso}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-card grid min-w-0 grid-cols-1 gap-5 rounded-2xl border p-4 shadow-sm sm:p-6"
          >
            {paso === 0 && (
              <>
                <Encabezado titulo="¿Qué auto se vende?" sub="Elegilo de tu stock o cargá sus datos ahora." />
                {!cargandoNuevo ? (
                  <div className="grid gap-2">
                    {autos.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => elegirAuto(a)}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-3 rounded-xl border p-2 text-left transition",
                          vehicleId === a.id ? "border-primary ring-primary/20 bg-primary/5 ring-4" : "hover:bg-accent"
                        )}
                      >
                        <div className="bg-muted flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                          {a.portada ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.portada} alt="" className="size-full object-cover" />
                          ) : (
                            <Car className="text-muted-foreground size-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{a.titulo}</p>
                          <p className="text-muted-foreground text-xs">
                            <span className="font-mono">{a.patente}</span> · {a.year} · {formatKm(a.mileageKm)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{formatArs(a.priceArs)}</span>
                      </button>
                    ))}
                    <Button type="button" variant="outline" className="h-12" onClick={() => setCargandoNuevo(true)}>
                      <Plus className="size-4" /> Cargar un auto que no está en el stock
                    </Button>
                  </div>
                ) : (
                  <form ref={formAutoRef} onSubmit={(e) => e.preventDefault()} className="grid gap-3">
                    <CamposVehiculo errorEn={error?.field} conPrecioCompra={false} />
                    {autos.length > 0 && (
                      <Button type="button" variant="ghost" onClick={() => setCargandoNuevo(false)}>
                        Volver a elegir del stock
                      </Button>
                    )}
                  </form>
                )}
              </>
            )}

            {paso === 1 && (
              <>
                <Encabezado titulo="¿Quién vende?" sub="Normalmente la concesionaria. Si es una venta en consignación, cargá al dueño." />
                <div className="grid grid-cols-2 gap-2">
                  <Opcion activa={vendeConcesionaria} onClick={() => setVendeConcesionaria(true)} icono={Building2} titulo={concesionaria.tradeName} sub={`CUIT ${concesionaria.cuit}`} />
                  <Opcion activa={!vendeConcesionaria} onClick={() => setVendeConcesionaria(false)} icono={User} titulo="Un particular" sub="Consignación" />
                </div>
                {!vendeConcesionaria && <CamposPersona prefijo="seller" valor={vendedor} onChange={setVendedor} errorEn={error?.field} />}
              </>
            )}

            {paso === 2 && (
              <>
                <Encabezado titulo="¿Quién compra?" sub="Empezá por el DNI: si ya es cliente, se completa solo." />
                <CamposPersona prefijo="buyer" valor={comprador} onChange={setComprador} errorEn={error?.field} />
              </>
            )}

            {paso === 3 && (
              <>
                <Encabezado titulo="Precio y forma de pago" sub="La seña genera su recibo automáticamente." />
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Precio total" htmlFor="precio" className="col-span-2 sm:col-span-1">
                    <EntradaPesos id="precio" value={precio} onValueChange={setPrecio} />
                  </Campo>
                  <Campo label="Fecha de la operación" htmlFor="fecha" className="col-span-2 sm:col-span-1">
                    <Entrada id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                  </Campo>
                  <Campo label="Forma de pago" htmlFor="formaPago" className="col-span-2 sm:col-span-1">
                    <Selector id="formaPago" value={formaPago} onChange={(e) => setFormaPago(e.target.value as typeof formaPago)}>
                      {Object.entries(FORMA_PAGO_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Selector>
                  </Campo>
                  <Campo label="Seña / entrega hoy" htmlFor="sena" hint="Dejalo vacío si todavía no pagó nada." className="col-span-2 sm:col-span-1">
                    <EntradaPesos id="sena" value={sena} onValueChange={setSena} />
                  </Campo>
                </div>

                {conPermuta && (
                  <div className="bg-muted/50 grid gap-3 rounded-xl p-3">
                    <p className="text-sm font-medium">Auto que entrega el cliente (permuta)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Campo label="Descripción" htmlFor="pDesc" className="col-span-2">
                        <Entrada id="pDesc" value={permuta.descripcion} onChange={(e) => setPermuta({ ...permuta, descripcion: e.target.value })} placeholder="Fiat Palio 2014 gris" />
                      </Campo>
                      <Campo label="Patente" htmlFor="pPat">
                        <Entrada id="pPat" className="font-mono uppercase" value={permuta.patente} onChange={(e) => setPermuta({ ...permuta, patente: e.target.value })} />
                      </Campo>
                      <Campo label="Se toma en" htmlFor="pVal">
                        <EntradaPesos id="pVal" value={permuta.valor} onValueChange={(v) => setPermuta({ ...permuta, valor: v })} />
                      </Campo>
                    </div>
                  </div>
                )}

                <Campo label="Detalle del pago del saldo" htmlFor="notasPago" hint="Ej.: saldo por transferencia contra entrega / crédito prendario Banco X en 24 cuotas.">
                  <Entrada id="notasPago" value={notasPago} onChange={(e) => setNotasPago(e.target.value)} />
                </Campo>
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Gastos de transferencia a cargo de" htmlFor="gastos">
                    <Selector id="gastos" value={gastosPor} onChange={(e) => setGastosPor(e.target.value as typeof gastosPor)}>
                      <option value="COMPRADOR">Comprador</option>
                      <option value="VENDEDOR">Vendedor</option>
                      <option value="AMBOS">Mitad cada uno</option>
                    </Selector>
                  </Campo>
                  <Campo label="Plazo para transferir (días)" htmlFor="dias">
                    <Entrada id="dias" inputMode="numeric" value={diasTransferencia} onChange={(e) => setDiasTransferencia(e.target.value.replace(/\D/g, ""))} />
                  </Campo>
                </div>
                <Campo label="6º) Otra (opcional)" htmlFor="clausulas" hint="Se imprime en el punto 6º del boleto. Ej.: se entrega con VTV vigente y dos juegos de llaves.">
                  <AreaTexto id="clausulas" value={clausulas} onChange={(e) => setClausulas(e.target.value)} />
                </Campo>
              </>
            )}

            <AvisoError>{error?.msg}</AvisoError>

            <div className="flex gap-2">
              {paso > 0 && (
                <Button type="button" variant="outline" size="lg" className="h-12" onClick={() => setPaso(paso - 1)}>
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              {paso < PASOS.length - 1 ? (
                <Button type="button" size="lg" className="h-12 flex-1 text-base" onClick={siguiente} disabled={enviando}>
                  {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
                  Siguiente <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" variant="trust" size="lg" className="h-12 flex-1 text-base" onClick={confirmar} disabled={enviando || !precio}>
                  {enviando ? <Loader2 className="size-4 animate-spin" /> : <FileSignature className="size-4" />}
                  Generar boleto y papeles
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Vista previa en vivo del boleto */}
      <aside className="lg:sticky lg:top-6">
        <div className="relative rounded-2xl border bg-[#fdfcf8] p-5 font-serif text-[13px] leading-relaxed text-neutral-800 shadow-xl shadow-black/5 dark:bg-neutral-100">
          <div className="text-muted-foreground mb-1 font-sans text-[10px] tracking-widest uppercase">Vista previa</div>
          <p className="mb-3 text-center font-bold tracking-wide">BOLETO COMPRAVENTA</p>
          <p>
            En <Dato v={concesionaria.ciudad} />, a los <Dato v={fecha ? Number(fecha.slice(8, 10)) : null} /> días…, entre el/los señor/es{" "}
            <Dato v={vendeConcesionaria ? concesionaria.legalName : vendedor.fullName} />, doc. de ident. nº{" "}
            <Dato v={vendeConcesionaria ? concesionaria.cuit : vendedor.docNumber} />, en su carácter de <b>VENDEDOR/ES</b>, y el/los
            señor/es <Dato v={comprador.fullName} />, doc. de ident. nº <Dato v={comprador.docNumber} />, domiciliado/s en calle{" "}
            <Dato v={comprador.address} />, en su carácter de <b>COMPRADOR/ES</b>…
          </p>
          <p className="mt-2">
            <b>1º)</b> Vende/n un/a <Dato v={auto?.titulo} /> Dominio Nº <Dato v={auto?.patente} mono />, motor Nº{" "}
            <Dato v={auto?.engineNumber} mono /> y Chasis Nº <Dato v={auto?.vin} mono /> en la suma de pesos{" "}
            <span className="text-[11px]">{precio ? montoALetras(precio).replace(/^PESOS /, "").toLowerCase() : "…"}</span> (
            <Dato v={precio ? formatArs(precio) : null} />).
          </p>
          <p className="mt-2">
            <b>5º)</b> Gastos de transferencia a cargo de <Dato v={{ COMPRADOR: "el comprador", VENDEDOR: "el vendedor", AMBOS: "ambas partes" }[gastosPor]} />{" "}
            dentro de los <Dato v={diasTransferencia} /> días.
          </p>
          <div className="mt-4 grid gap-1 border-t border-dashed border-neutral-300 pt-3 font-sans text-xs">
            <Fila k="Seña / entrega" v={sena ? formatArs(sena) : "—"} />
            {conPermuta && <Fila k="Permuta" v={permuta.valor ? formatArs(permuta.valor) : "—"} />}
            <Fila k="Saldo" v={precio ? formatArs(Math.max(saldo, 0)) : "—"} fuerte />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Encabezado({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="text-muted-foreground text-sm">{sub}</p>
    </div>
  );
}

function Opcion({
  activa,
  onClick,
  icono: Icono,
  titulo,
  sub,
}: {
  activa: boolean;
  onClick: () => void;
  icono: React.ElementType;
  titulo: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition",
        activa ? "border-primary bg-primary/5 ring-primary/20 ring-4" : "hover:bg-accent"
      )}
    >
      <Icono className={cn("size-5", activa ? "text-primary" : "text-muted-foreground")} />
      <span className="leading-tight font-medium">{titulo}</span>
      <span className="text-muted-foreground text-xs">{sub}</span>
    </button>
  );
}

function Dato({ v, mono }: { v?: string | number | null; mono?: boolean }) {
  return v ? (
    <mark className={cn("rounded bg-amber-100 px-0.5 text-neutral-900", mono && "font-mono text-[12px]")}>{v}</mark>
  ) : (
    <span className="text-neutral-400">________</span>
  );
}

function Fila({ k, v, fuerte }: { k: string; v: string; fuerte?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-500">{k}</span>
      <span className={cn("tabular-nums", fuerte && "font-bold")}>{v}</span>
    </div>
  );
}
