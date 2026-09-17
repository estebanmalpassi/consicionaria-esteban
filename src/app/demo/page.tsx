"use client";

import { SwipeableVehicleCardStack } from "@/components/vehicles/swipeable-vehicle-card-stack";
import { VerificationStatusBadgePanel } from "@/components/vehicles/verification-status-badge-panel";
import { DealershipOnboardingWizard } from "@/components/dealership/dealership-onboarding-wizard";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";

export default function DemoPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Componentes core — Concesionaria Esteban
        </h1>
        <p className="text-muted-foreground mt-2">
          Vista de referencia de los tres bloques centrales del producto.
        </p>
      </header>

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-xl font-medium">1. Discovery feed swipeable</h2>
        <SwipeableVehicleCardStack
          vehicles={MOCK_VEHICLES}
          onSwipe={(vehicle, direction) =>
            console.log(`${direction === "right" ? "Guardado" : "Descartado"}:`, vehicle.brand, vehicle.model)
          }
        />
      </section>

      <Separator />

      <section className="flex flex-col items-center gap-6">
        <h2 className="text-xl font-medium">2. Panel de verificación (Trust & Safety)</h2>
        <div className="grid w-full max-w-md gap-4">
          <VerificationStatusBadgePanel items={MOCK_VEHICLES[0].verifications} />
          <VerificationStatusBadgePanel items={MOCK_VEHICLES[1].verifications} />
        </div>
      </section>

      <Separator />

      <section id="onboarding" className="flex flex-col items-center gap-6 scroll-mt-16">
        <h2 className="text-xl font-medium">3. Wizard de onboarding de concesionaria</h2>
        <DealershipOnboardingWizard
          onSubmit={async (values) => {
            await new Promise((r) => setTimeout(r, 800));
            console.log("Onboarding submitted", values);
          }}
        />
      </section>
    </div>
  );
}
