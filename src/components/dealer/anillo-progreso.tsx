/** Anillo de avance de los trámites de la operación. */
export function AnilloProgreso({ porcentaje, tamano = 40 }: { porcentaje: number; tamano?: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 40 40" className="size-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-trust transition-all"
          strokeDasharray={c}
          strokeDashoffset={c - (c * porcentaje) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">{porcentaje}%</span>
    </div>
  );
}
