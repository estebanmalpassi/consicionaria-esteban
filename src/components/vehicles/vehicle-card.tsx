import { Fuel, Gauge, MapPin } from "lucide-react";

import { cn, formatArs, formatKm } from "@/lib/utils";
import { FUEL_LABELS, TRANSMISSION_LABELS, type VehicleSummary } from "@/types/vehicle";
import { VerificationStatusBadgePanel } from "@/components/vehicles/verification-status-badge-panel";
import { Badge } from "@/components/ui/badge";

export function VehicleCard({
  vehicle,
  className,
}: {
  vehicle: VehicleSummary;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-lg",
        className
      )}
    >
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vehicle.coverPhotoUrl}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="size-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-3">
          <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur">
            {vehicle.dealershipName}
          </Badge>
          <VerificationStatusBadgePanel items={vehicle.verifications} compact />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-lg leading-tight font-semibold text-white">
            {vehicle.brand} {vehicle.model} {vehicle.version ?? ""}
          </p>
          <p className="text-2xl font-bold text-white">{formatArs(vehicle.priceArs)}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <span className="font-medium text-foreground">{vehicle.year}</span>
          <span className="flex items-center gap-1">
            <Gauge className="size-3.5" /> {formatKm(vehicle.mileageKm)}
          </span>
          <span className="flex items-center gap-1">
            <Fuel className="size-3.5" /> {FUEL_LABELS[vehicle.fuelType]}
          </span>
          {vehicle.city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {vehicle.city}
              {vehicle.province ? `, ${vehicle.province}` : ""}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{TRANSMISSION_LABELS[vehicle.transmission]}</Badge>
          <Badge variant="outline">Patente {vehicle.patente}</Badge>
        </div>
      </div>
    </div>
  );
}
