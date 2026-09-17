import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getOwnDealership, submitOnboardingAction } from "@/lib/actions/dealership";
import { DealershipOnboardingWizard } from "@/components/dealership/dealership-onboarding-wizard";

export default async function DealerOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dealer/onboarding");
  }
  if (session.user.role !== "DEALER_OWNER") {
    redirect("/");
  }

  const dealership = await getOwnDealership(session.user.id);
  if (dealership?.status === "VERIFIED") {
    redirect("/dealer");
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-b from-background to-muted/40 px-4 py-16">
      <DealershipOnboardingWizard onSubmit={submitOnboardingAction} />
    </div>
  );
}
