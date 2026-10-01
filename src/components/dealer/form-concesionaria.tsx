"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { submitOnboardingAction } from "@/lib/actions/dealership";
import { ARGENTINE_PROVINCES, type DealershipOnboardingValues } from "@/lib/validations/dealership";
import { Button } from "@/components/ui/button";
import { AvisoError, Campo, Entrada, Selector } from "@/components/dealer/campo";

/** Datos de la concesionaria: son los que se imprimen en el boleto y los recibos. */
export function FormConcesionaria({ inicial }: { inicial?: Partial<DealershipOnboardingValues> }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  const d = (k: keyof DealershipOnboardingValues) => inicial?.[k] ?? "";

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const o = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        setEnviando(true);
        setError(null);
        const res = await submitOnboardingAction(o as unknown as DealershipOnboardingValues);
        if (!res.ok) {
          setEnviando(false);
          return setError(res.error ?? "No se pudo guardar.");
        }
        router.push("/dealer");
        router.refresh();
      }}
    >
      <input type="hidden" name="afipConditionIva" value={d("afipConditionIva") || "RESPONSABLE_INSCRIPTO"} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Nombre comercial" htmlFor="tradeName" hint="Como te conocen los clientes.">
          <Entrada id="tradeName" name="tradeName" required defaultValue={d("tradeName")} placeholder="Cartuccia Automotores" />
        </Campo>
        <Campo label="Razón social" htmlFor="legalName" hint="Como figura en ARCA (ex AFIP).">
          <Entrada id="legalName" name="legalName" required defaultValue={d("legalName")} placeholder="Cartuccia Automotores S.R.L." />
        </Campo>
        <Campo label="CUIT" htmlFor="cuit">
          <Entrada id="cuit" name="cuit" required inputMode="numeric" defaultValue={d("cuit")} placeholder="30-71234567-4" />
        </Campo>
      </div>
      <Campo label="Domicilio" htmlFor="addressStreet">
        <Entrada id="addressStreet" name="addressStreet" required defaultValue={d("addressStreet")} placeholder="Fray Mamerto Esquiú 57" />
      </Campo>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Campo label="Localidad" htmlFor="addressCity">
          <Entrada id="addressCity" name="addressCity" required defaultValue={d("addressCity")} />
        </Campo>
        <Campo label="Provincia" htmlFor="province">
          <Selector id="province" name="province" required defaultValue={d("province")}>
            <option value="">—</option>
            {ARGENTINE_PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Selector>
        </Campo>
        <Campo label="Cód. postal" htmlFor="postalCode">
          <Entrada id="postalCode" name="postalCode" required defaultValue={d("postalCode")} />
        </Campo>
        <Campo label="Teléfono" htmlFor="phone">
          <Entrada id="phone" name="phone" type="tel" required defaultValue={d("phone")} />
        </Campo>
      </div>
      <AvisoError>{error}</AvisoError>
      <Button type="submit" size="lg" className="h-12 text-base" disabled={enviando}>
        {enviando && <Loader2 className="size-4 animate-spin" />} Guardar y entrar al panel
      </Button>
    </form>
  );
}
