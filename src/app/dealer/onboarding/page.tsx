import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { getOwnDealership } from "@/lib/actions/dealership";
import { FormConcesionaria } from "@/components/dealer/form-concesionaria";

export default async function DealerOnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/onboarding");
  if (session.user.role !== "DEALER_OWNER") redirect("/dealer");

  const d = await getOwnDealership(session.user.id);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-10 sm:px-6">
      {d && (
        <Link href="/dealer/ajustes" className="text-muted-foreground inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> Volver
        </Link>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{d ? "Datos de la concesionaria" : "Contanos de tu concesionaria"}</h1>
        <p className="text-muted-foreground text-sm">
          Estos datos salen impresos en los boletos, recibos y facturas. Lo completás una sola vez.
        </p>
      </div>
      <div className="bg-card rounded-2xl border p-4 sm:p-6">
        <FormConcesionaria
          inicial={
            d
              ? {
                  tradeName: d.tradeName,
                  legalName: d.legalName,
                  cuit: d.cuit,
                  afipConditionIva: (d.afipConditionIva ?? "RESPONSABLE_INSCRIPTO") as "RESPONSABLE_INSCRIPTO",
                  addressStreet: d.addressStreet ?? "",
                  addressCity: d.addressCity ?? "",
                  province: d.province ?? "",
                  postalCode: d.postalCode ?? "",
                  phone: d.phone ?? "",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
