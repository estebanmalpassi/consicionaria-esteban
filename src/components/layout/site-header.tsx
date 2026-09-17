import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="text-trust size-5" />
          Concesionaria Esteban
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {session?.user ? (
            <>
              {(session.user.role === "DEALER_OWNER" || session.user.role === "DEALER_STAFF") && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dealer">Mi concesionaria</Link>
                </Button>
              )}
              <span className="text-muted-foreground hidden sm:inline">
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="outline" size="sm" type="submit">
                  Cerrar sesión
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Registrarme</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
