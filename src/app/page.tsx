import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-background to-muted/40 px-6 text-center">
      <span className="bg-trust-muted text-trust flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
        <ShieldCheck className="size-4" />
        Documentación verificada, siempre
      </span>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        El marketplace de autos donde cada transacción es segura
      </h1>
      <p className="text-muted-foreground max-w-xl text-lg text-balance">
        Formulario 08, Título, Tarjeta Verde, Libre de Deuda e Informe de
        Dominio, verificados automáticamente antes de publicar. Comprá y
        vendé con confianza.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/demo">
            Ver componentes del producto <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/demo#onboarding">Registrar mi concesionaria</Link>
        </Button>
      </div>
    </div>
  );
}
