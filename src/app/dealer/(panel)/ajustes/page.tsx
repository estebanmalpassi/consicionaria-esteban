import Link from "next/link";

import { requireDealer } from "@/lib/dealer";
import { prisma } from "@/lib/prisma";
import { AccionesEmpleado } from "@/components/dealer/acciones-empleado";
import { SelectorTema } from "@/components/dealer/selector-tema";

export default async function AjustesPage() {
  const { dealership: d, esDueno } = await requireDealer();
  const equipo = await prisma.user.findMany({
    where: { OR: [{ id: d.ownerId }, { dealershipId: d.id, role: "DEALER_STAFF" }] },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
  const hayCodigo = Boolean(process.env.CODIGO_INVITACION?.trim());

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>

      <section className="bg-card grid gap-3 rounded-2xl border p-5" aria-labelledby="t-apariencia">
        <div>
          <h2 id="t-apariencia" className="font-semibold">
            Apariencia
          </h2>
          <p className="text-muted-foreground text-sm">Se guarda en este celular o computadora. Los papeles para imprimir siempre salen en blanco.</p>
        </div>
        <SelectorTema />
      </section>

      <section className="bg-card grid gap-2 rounded-2xl border p-5">
        <h2 className="font-semibold">Datos que salen en los papeles</h2>
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <Dato k="Nombre comercial" v={d.tradeName} />
          <Dato k="Razón social" v={d.legalName} />
          <Dato k="CUIT" v={d.cuit} />
          <Dato k="Domicilio" v={[d.addressStreet, d.addressCity, d.province].filter(Boolean).join(", ")} />
          <Dato k="Teléfono" v={d.phone ?? "—"} />
        </dl>
        {esDueno && (
          <Link href="/dealer/onboarding" className="text-primary w-fit text-sm font-medium hover:underline">
            Editar datos de la concesionaria
          </Link>
        )}
      </section>

      <section className="bg-card grid gap-4 rounded-2xl border p-5">
        <div>
          <h2 className="font-semibold">Equipo con acceso al panel</h2>
          <p className="text-muted-foreground text-sm">
            Para sumar a alguien, pasale el <b>código de invitación</b>: se registra en &quot;Acceso equipo → Registrate&quot; y
            entra directo a este panel. Con &quot;Hacer dueño&quot; le pasás la administración de la agencia.
            {!hayCodigo && " Hoy el registro está cerrado porque no hay código configurado en Vercel (CODIGO_INVITACION)."}
          </p>
        </div>
        <ul className="divide-y rounded-xl border">
          {equipo.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.name}</p>
                <p className="text-muted-foreground truncate text-xs">{u.email}</p>
              </div>
              <span className="bg-muted rounded-md px-2 py-0.5 text-xs font-medium">
                {u.id === d.ownerId ? "Dueño" : "Empleado"}
              </span>
              {esDueno && u.id !== d.ownerId && <AccionesEmpleado userId={u.id} nombre={u.name} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b py-1.5 sm:block sm:border-0">
      <dt className="text-muted-foreground text-xs">{k}</dt>
      <dd className="font-medium">{v || "—"}</dd>
    </div>
  );
}
