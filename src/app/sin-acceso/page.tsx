import Link from "next/link";

import { signOut } from "@/lib/auth";
import { MARCA } from "@/lib/marca";

/** Cuenta sin acceso al panel (no es de la agencia o le quitaron el acceso). */
export default function SinAccesoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_top,#1f3348_0%,#0d1824_55%,#080f17_100%)] px-6 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MARCA.logoEscudo} alt={MARCA.nombre} className="w-48" />
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-bold">Esta cuenta no tiene acceso al panel</h1>
        <p className="text-white/70">
          El panel es solo para el equipo de {MARCA.nombre}. Si sos parte de la agencia, pedile acceso al dueño.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="h-11 rounded-full bg-[#d4ad55] px-6 font-semibold text-[#0b1520]">
            Entrar con otra cuenta
          </button>
        </form>
        <Link href="/" className="inline-flex h-11 items-center rounded-full border border-white/20 px-6 font-semibold">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
