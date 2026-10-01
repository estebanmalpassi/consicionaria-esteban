/**
 * Convierte un monto a letras en castellano rioplatense, tal como se escribe
 * en boletos de compraventa y recibos: "PESOS UN MILLÓN DOSCIENTOS MIL CON 00/100".
 */

const UNIDADES = [
  "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
  "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos",
];

/** 0..999 */
function hastaMil(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = CENTENAS[c];
  if (resto > 0) {
    let dec: string;
    if (resto < 30) dec = UNIDADES[resto];
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      dec = DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : "");
    }
    texto = texto ? `${texto} ${dec}` : dec;
  }
  return texto;
}

/** "uno" -> "un" delante de "mil"/"millones"/sustantivos ("veintiuno" -> "veintiún"). */
function apocopar(texto: string): string {
  return texto.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
}

export function enteroALetras(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "cero";

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];

  if (millones > 0) {
    partes.push(millones === 1 ? "un millón" : `${apocopar(enteroALetras(millones))} millones`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? "mil" : `${apocopar(hastaMil(miles))} mil`);
  }
  if (resto > 0) partes.push(hastaMil(resto));

  return partes.join(" ");
}

/** "PESOS UN MILLÓN QUINIENTOS MIL CON 00/100" */
export function montoALetras(monto: number | string, moneda = "pesos"): string {
  const valor = typeof monto === "string" ? Number(monto) : monto;
  const entero = Math.floor(valor);
  const centavos = Math.round((valor - entero) * 100);
  const letras = apocopar(enteroALetras(entero));
  return `${moneda} ${letras} con ${String(centavos).padStart(2, "0")}/100`.toUpperCase();
}
