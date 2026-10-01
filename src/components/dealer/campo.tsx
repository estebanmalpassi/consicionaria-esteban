import * as React from "react";

import { cn } from "@/lib/utils";

/** Etiqueta + control + ayuda/error. Pensado para que se lea bien en el celular. */
export function Campo({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)} data-error={error || undefined}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

const controlBase =
  "border-input bg-background flex h-11 w-full min-w-0 rounded-lg border px-3 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm";

export function Entrada({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlBase, "placeholder:text-muted-foreground", className)} {...props} />;
}

export function Selector({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(controlBase, "appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function AreaTexto({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, "placeholder:text-muted-foreground h-auto min-h-24 py-2.5", className)}
      {...props}
    />
  );
}

/** Entrada de dinero: muestra "$ 12.500.000" mientras se escribe pero envía el número limpio. */
export function EntradaPesos({
  name,
  defaultValue,
  value: controlled,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  defaultValue?: number | string | null;
  value?: number | null;
  onValueChange?: (v: number | null) => void;
}) {
  const [interno, setInterno] = React.useState<number | null>(
    defaultValue === null || defaultValue === undefined || defaultValue === "" ? null : Number(defaultValue)
  );
  const valor = controlled !== undefined ? controlled : interno;
  const texto = valor === null || Number.isNaN(valor) ? "" : new Intl.NumberFormat("es-AR").format(valor);

  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">$</span>
      <Entrada
        inputMode="numeric"
        className="pl-7 tabular-nums"
        value={texto}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, "");
          const n = digitos ? Number(digitos) : null;
          setInterno(n);
          onValueChange?.(n);
        }}
        {...props}
      />
      {name && <input type="hidden" name={name} value={valor ?? ""} />}
    </div>
  );
}

export function AvisoError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="bg-destructive/10 text-destructive rounded-lg px-3 py-2.5 text-sm">
      {children}
    </p>
  );
}
