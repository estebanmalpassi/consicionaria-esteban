import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { MARCA } from "@/lib/marca";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="border-b print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dealer" className="flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARCA.logoCirculo} alt="" className="size-9 shrink-0 rounded-full" />
          <span className="truncate font-[family-name:var(--font-marca)] text-sm leading-tight font-extrabold tracking-wide uppercase">
            {MARCA.nombreCorto}
            <span className="text-muted-foreground block text-[10px] font-semibold tracking-[0.2em]">Automotores</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden sm:inline">{session.user.name}</span>
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
        </div>
      </div>
    </header>
  );
}
