"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BotonImprimir() {
  return (
    <Button type="button" size="lg" className="h-11" onClick={() => window.print()}>
      <Printer className="size-4" /> Imprimir / guardar PDF
    </Button>
  );
}
