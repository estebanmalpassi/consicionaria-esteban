"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, FileSignature, Home, Plus, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dealer", label: "Inicio", icono: Home, exacto: true },
  { href: "/dealer/operaciones", label: "Operaciones", icono: FileSignature },
  { href: "/dealer/operaciones/nueva", label: "Nueva venta", icono: Plus, destacado: true },
  { href: "/dealer/stock", label: "Stock", icono: Car },
  { href: "/dealer/ajustes", label: "Ajustes", icono: Settings },
];

export function NavegacionPanel({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const activo = (href: string, exacto?: boolean) =>
    exacto ? pathname === href : pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith("/dealer/operaciones/nueva"));

  return (
    <>
      {/* Escritorio: barra lateral */}
      <aside className="hidden w-60 shrink-0 border-r md:block print:hidden">
        <nav className="sticky top-0 flex flex-col gap-1 p-4">
          <p className="text-muted-foreground mb-3 truncate px-2 text-xs font-semibold tracking-wider uppercase">{nombre}</p>
          {ITEMS.map(({ href, label, icono: Icono, exacto, destacado }) =>
            destacado ? (
              <Link
                key={href}
                href={href}
                className="bg-primary text-primary-foreground hover:bg-primary/90 my-2 flex h-11 items-center gap-2 rounded-xl px-3 font-medium shadow-sm"
              >
                <Icono className="size-4" /> {label}
              </Link>
            ) : (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-lg px-3 text-sm transition",
                  activo(href, exacto) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/60"
                )}
              >
                <Icono className="size-4" /> {label}
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Celular: barra inferior tipo app */}
      <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
        {ITEMS.map(({ href, label, icono: Icono, exacto, destacado }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
              activo(href, exacto) ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            {destacado ? (
              <span className="bg-primary text-primary-foreground -mt-6 flex size-12 items-center justify-center rounded-full shadow-lg ring-4 ring-background">
                <Icono className="size-5" />
              </span>
            ) : (
              <Icono className="size-5" />
            )}
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
