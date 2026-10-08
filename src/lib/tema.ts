/** Apariencia del panel, elegida en Ajustes y guardada en cada celular o computadora. */
export type Tema = "claro" | "oscuro" | "auto";

export const CLAVE_TEMA = "cartuccia-tema";
export const EVENTO_TEMA = "cartuccia-tema";

/**
 * Se ejecuta antes de pintar la página para que no se vea un "flash" blanco
 * cuando el panel está en oscuro. Por defecto queda claro.
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CLAVE_TEMA}");var d=t==="oscuro"||(t==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export function leerTema(): Tema {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    return t === "oscuro" || t === "auto" ? t : "claro";
  } catch {
    return "claro";
  }
}

export function aplicarTema(tema: Tema) {
  const oscuro = tema === "oscuro" || (tema === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", oscuro);
}

export function guardarTema(tema: Tema) {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Sin almacenamiento (modo privado): se aplica igual mientras dure la visita.
  }
  aplicarTema(tema);
  window.dispatchEvent(new Event(EVENTO_TEMA));
}
