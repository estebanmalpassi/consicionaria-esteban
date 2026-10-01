import { SiteHeader } from "@/components/layout/site-header";

/** Todo lo de /dealer (panel y datos de la concesionaria) lleva el encabezado con la sesión. */
export default function DealerLayout({ children }: LayoutProps<"/dealer">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
