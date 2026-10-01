import Link from "next/link";

import { MARCA } from "@/lib/marca";

/** Login y registro a pantalla completa con la estética de la marca (azul noche + dorado). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-[radial-gradient(ellipse_at_top,#1f3348_0%,#0d1824_55%,#080f17_100%)] px-4 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[#d4ad55]/10 blur-3xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MARCA.logoEscudo} alt={MARCA.nombre} className="relative w-56 drop-shadow-[0_10px_30px_rgba(212,173,85,0.25)] sm:w-64" />
      <div className="relative w-full max-w-sm">{children}</div>
      <p className="relative font-[family-name:var(--font-marca)] text-xs tracking-[0.25em] text-[#d4ad55]/80 uppercase">
        {MARCA.eslogan}
      </p>
      <Link href="/" className="relative text-sm text-white/60 hover:text-white">
        ← Volver al inicio
      </Link>
    </div>
  );
}
