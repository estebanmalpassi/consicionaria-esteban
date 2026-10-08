import type { Metadata, Viewport } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { SeguirTemaDelSistema } from "@/components/dealer/selector-tema";
import { MARCA } from "@/lib/marca";

// El panel se puede instalar en el celular y abrirse como una app.
export const metadata: Metadata = {
  manifest: "/app.webmanifest",
  appleWebApp: { capable: true, title: MARCA.nombreCorto, statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#0b1520",
};

/** Todo lo de /dealer (panel y datos de la concesionaria) lleva el encabezado con la sesión. */
export default function DealerLayout({ children }: LayoutProps<"/dealer">) {
  return (
    <>
      <SeguirTemaDelSistema />
      <SiteHeader />
      {children}
    </>
  );
}
