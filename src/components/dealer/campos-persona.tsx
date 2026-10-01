"use client";

import * as React from "react";
import { Loader2, UserCheck } from "lucide-react";

import { buscarPersonaAction } from "@/lib/actions/operaciones";
import type { PersonaValues } from "@/lib/validations/operacion";
import { ARGENTINE_PROVINCES } from "@/lib/validations/dealership";
import { Campo, Entrada, Selector } from "@/components/dealer/campo";

export const PERSONA_VACIA: PersonaValues = {
  fullName: "",
  docType: "DNI",
  docNumber: "",
  ivaCondition: "CONSUMIDOR_FINAL",
  nationality: "Argentina",
  maritalStatus: "",
  birthDate: "",
  occupation: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
  email: "",
};

/**
 * Datos de una persona (comprador o vendedor). Al salir del campo DNI busca si
 * ya estaba cargada en otra operación y autocompleta todo.
 */
export function CamposPersona({
  prefijo,
  valor,
  onChange,
  errorEn,
}: {
  prefijo: "buyer" | "seller";
  valor: PersonaValues;
  onChange: (v: PersonaValues) => void;
  errorEn?: string;
}) {
  const [buscando, setBuscando] = React.useState(false);
  const [encontrado, setEncontrado] = React.useState(false);
  const set = (k: keyof PersonaValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...valor, [k]: e.target.value });
  const id = (k: string) => `${prefijo}-${k}`;
  const inv = (k: string) => (errorEn === `${prefijo}.${k}` ? true : undefined);

  const autocompletar = async () => {
    if (!valor.docNumber || valor.docNumber.length < 6) return;
    setBuscando(true);
    const p = await buscarPersonaAction(valor.docNumber);
    setBuscando(false);
    if (p) {
      onChange({ ...p });
      setEncontrado(true);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <Campo label="Documento" htmlFor={id("docType")}>
          <Selector id={id("docType")} value={valor.docType} onChange={set("docType")}>
            <option>DNI</option>
            <option>CUIT</option>
            <option>CUIL</option>
            <option>Pasaporte</option>
          </Selector>
        </Campo>
        <Campo label="Número" htmlFor={id("docNumber")} hint={encontrado ? undefined : "Si ya compró o vendió antes, se completa solo."}>
          <div className="relative">
            <Entrada
              id={id("docNumber")}
              inputMode="numeric"
              value={valor.docNumber}
              onChange={(e) => {
                setEncontrado(false);
                set("docNumber")(e);
              }}
              onBlur={autocompletar}
              placeholder="30123456"
              aria-invalid={inv("docNumber")}
            />
            {buscando && <Loader2 className="text-muted-foreground absolute top-3 right-3 size-4 animate-spin" />}
          </div>
          {encontrado && (
            <p className="text-trust flex items-center gap-1 text-xs font-medium">
              <UserCheck className="size-3.5" /> Cliente encontrado, datos completados.
            </p>
          )}
        </Campo>
      </div>

      <Campo label="Nombre y apellido completos" htmlFor={id("fullName")}>
        <Entrada id={id("fullName")} value={valor.fullName} onChange={set("fullName")} placeholder="Como figura en el DNI" aria-invalid={inv("fullName")} />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Condición frente al IVA" htmlFor={id("ivaCondition")} className="col-span-2 sm:col-span-1">
          <Selector id={id("ivaCondition")} value={valor.ivaCondition} onChange={set("ivaCondition")}>
            <option value="CONSUMIDOR_FINAL">Consumidor final</option>
            <option value="RESPONSABLE_INSCRIPTO">Responsable inscripto</option>
            <option value="MONOTRIBUTO">Monotributista</option>
            <option value="EXENTO">Exento</option>
          </Selector>
        </Campo>
        <Campo label="Estado civil" htmlFor={id("maritalStatus")}>
          <Selector id={id("maritalStatus")} value={valor.maritalStatus} onChange={set("maritalStatus")}>
            <option value="">—</option>
            <option>Soltero/a</option>
            <option>Casado/a</option>
            <option>Divorciado/a</option>
            <option>Viudo/a</option>
            <option>Unión convivencial</option>
          </Selector>
        </Campo>
        <Campo label="Nacionalidad" htmlFor={id("nationality")}>
          <Entrada id={id("nationality")} value={valor.nationality} onChange={set("nationality")} />
        </Campo>
      </div>

      <Campo label="Domicilio" htmlFor={id("address")}>
        <Entrada id={id("address")} value={valor.address} onChange={set("address")} placeholder="Calle, número, piso" aria-invalid={inv("address")} />
      </Campo>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Campo label="Localidad" htmlFor={id("city")}>
          <Entrada id={id("city")} value={valor.city} onChange={set("city")} />
        </Campo>
        <Campo label="Provincia" htmlFor={id("province")}>
          <Selector id={id("province")} value={valor.province} onChange={set("province")}>
            <option value="">—</option>
            {ARGENTINE_PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Selector>
        </Campo>
        <Campo label="Cód. postal" htmlFor={id("postalCode")}>
          <Entrada id={id("postalCode")} value={valor.postalCode} onChange={set("postalCode")} />
        </Campo>
        <Campo label="Teléfono" htmlFor={id("phone")}>
          <Entrada id={id("phone")} type="tel" value={valor.phone} onChange={set("phone")} />
        </Campo>
        <Campo label="Email" htmlFor={id("email")} className="col-span-2 sm:col-span-2">
          <Entrada id={id("email")} type="email" value={valor.email} onChange={set("email")} aria-invalid={inv("email")} />
        </Campo>
      </div>
    </div>
  );
}
