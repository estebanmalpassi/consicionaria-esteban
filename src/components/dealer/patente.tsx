import { cn } from "@/lib/utils";

/** Patente con el diseño de la chapa Mercosur: franja azul arriba y letras negras. */
export function Patente({ valor, tamano = "chica", className }: { valor: string; tamano?: "chica" | "grande"; className?: string }) {
  const grande = tamano === "grande";
  return (
    <span
      className={cn(
        "inline-grid shrink-0 overflow-hidden rounded-[5px] border-[1.5px] border-neutral-900 bg-white text-center leading-none",
        grande && "rounded-md border-2",
        className
      )}
    >
      <span className={cn("bg-[#1f4fa3] font-bold tracking-[0.14em] text-white", grande ? "px-2 py-0.5 text-[7px]" : "px-1 py-px text-[5px]")}>
        REPÚBLICA ARGENTINA
      </span>
      <span className={cn("font-mono font-bold tracking-[0.08em] text-neutral-900", grande ? "px-3 py-1 text-xl" : "px-1.5 py-0.5 text-[11px]")}>
        {valor}
      </span>
    </span>
  );
}
