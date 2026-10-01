import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/** No hay portada pública: se entra directo al panel (o al login). */
export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "DEALER_OWNER" || session.user.role === "DEALER_STAFF") redirect("/dealer");

  // Cuentas viejas de "comprador" del marketplace: no tienen panel.
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="max-w-sm">Esta cuenta no pertenece a una concesionaria. Ingresá con la cuenta de la concesionaria.</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit">Cambiar de cuenta</Button>
      </form>
    </div>
  );
}
