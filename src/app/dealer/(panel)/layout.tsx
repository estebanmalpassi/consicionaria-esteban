import { requireDealer } from "@/lib/dealer";
import { NavegacionPanel } from "@/components/dealer/navegacion-panel";

export default async function PanelLayout({ children }: LayoutProps<"/dealer">) {
  const { dealership } = await requireDealer();
  return (
    <div className="flex flex-1">
      <NavegacionPanel nombre={dealership.tradeName} />
      <div className="min-w-0 flex-1 pb-24 md:pb-10 print:p-0">{children}</div>
    </div>
  );
}
