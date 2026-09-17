import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Clock, ShieldCheck, ShieldX } from "lucide-react";

import { auth } from "@/lib/auth";
import { getOwnDealership } from "@/lib/actions/dealership";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABELS: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  PENDING: { label: "Pendiente de completar", icon: Clock, className: "bg-muted text-muted-foreground" },
  DOCS_SUBMITTED: { label: "Documentación enviada", icon: Clock, className: "bg-warning/15 text-warning-foreground" },
  IN_REVIEW: { label: "En revisión", icon: Clock, className: "bg-warning/15 text-warning-foreground" },
  VERIFIED: { label: "Verificada", icon: ShieldCheck, className: "bg-trust-muted text-trust" },
  REJECTED: { label: "Rechazada", icon: ShieldX, className: "bg-destructive/10 text-destructive" },
  SUSPENDED: { label: "Suspendida", icon: ShieldX, className: "bg-destructive/10 text-destructive" },
};

export default async function DealerDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dealer");
  }
  if (session.user.role !== "DEALER_OWNER" && session.user.role !== "DEALER_STAFF") {
    redirect("/");
  }

  const dealership = await getOwnDealership(session.user.id);

  if (!dealership) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <Building2 className="text-muted-foreground size-10" />
        <h1 className="text-xl font-semibold">Todavía no completaste el registro</h1>
        <p className="text-muted-foreground">
          Necesitamos los datos de tu concesionaria antes de que puedas publicar vehículos.
        </p>
        <Button asChild>
          <Link href="/dealer/onboarding">Completar registro</Link>
        </Button>
      </div>
    );
  }

  const statusMeta = STATUS_LABELS[dealership.status];
  const StatusIcon = statusMeta.icon;
  const canPublish = dealership.status === "VERIFIED";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{dealership.tradeName}</CardTitle>
              <CardDescription>{dealership.legalName} · CUIT {dealership.cuit}</CardDescription>
            </div>
            <Badge className={statusMeta.className}>
              <StatusIcon className="size-3.5" />
              {statusMeta.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!canPublish && (
            <p className="text-muted-foreground text-sm">
              Tu cuenta todavía no puede publicar vehículos. Te avisaremos por
              email en cuanto se confirmen las validaciones ante AFIP y, si
              corresponde, un administrador la apruebe.
            </p>
          )}
          <div className="flex gap-3">
            {dealership.status === "PENDING" || dealership.status === "REJECTED" ? (
              <Button asChild>
                <Link href="/dealer/onboarding">
                  {dealership.status === "REJECTED" ? "Volver a enviar datos" : "Completar registro"}
                </Link>
              </Button>
            ) : null}
            {canPublish ? (
              <Button variant="outline" asChild>
                <Link href="/dealer/listings/new">Publicar un vehículo</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Publicar un vehículo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
