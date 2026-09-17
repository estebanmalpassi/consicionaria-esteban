"use client";

import * as React from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Heart, RotateCcw, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { VehicleSummary } from "@/types/vehicle";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";

const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;
const VISIBLE_STACK_DEPTH = 3;

export type SwipeDirection = "left" | "right";

export interface SwipeableVehicleCardStackProps {
  vehicles: VehicleSummary[];
  onSwipe?: (vehicle: VehicleSummary, direction: SwipeDirection) => void;
  onStackEmpty?: () => void;
  className?: string;
}

/**
 * "Tinder-style" discovery feed: a swipeable stack of vehicle cards.
 * Swipe/drag right (or the ❤️ button) to save, left (or ✕) to pass.
 * Only the top ~3 cards render for performance; the rest are lazily revealed.
 */
export function SwipeableVehicleCardStack({
  vehicles,
  onSwipe,
  onStackEmpty,
  className,
}: SwipeableVehicleCardStackProps) {
  const [deck, setDeck] = React.useState(vehicles);
  const [history, setHistory] = React.useState<VehicleSummary[]>([]);
  const [trackedVehicles, setTrackedVehicles] = React.useState(vehicles);

  // Reset the deck whenever a new `vehicles` list is passed in (e.g. after
  // refetching filters). Derived during render per React's "adjusting state
  // when props change" pattern, rather than in an effect.
  if (vehicles !== trackedVehicles) {
    setTrackedVehicles(vehicles);
    setDeck(vehicles);
    setHistory([]);
  }

  const removeTop = React.useCallback(
    (direction: SwipeDirection) => {
      setDeck((current) => {
        const [top, ...rest] = current;
        if (!top) return current;
        onSwipe?.(top, direction);
        setHistory((h) => [...h, top]);
        return rest;
      });
    },
    [onSwipe]
  );

  React.useEffect(() => {
    if (deck.length === 0 && trackedVehicles.length > 0) {
      onStackEmpty?.();
    }
    // Only re-notify when the deck actually transitions to empty for a given
    // `vehicles` list, not on every re-render while it stays empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.length === 0, trackedVehicles]);

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setDeck((current) => [last, ...current]);
      return h.slice(0, -1);
    });
  };

  const visible = deck.slice(0, VISIBLE_STACK_DEPTH);

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="relative h-[520px] w-full max-w-sm">
        <AnimatePresence>
          {visible.length === 0 ? (
            <EmptyState key="empty" />
          ) : (
            visible
              .map((vehicle, index) => (
                <SwipeCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  stackIndex={index}
                  isTop={index === 0}
                  onDecide={removeTop}
                />
              ))
              .reverse()
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <Button
          size="icon"
          variant="outline"
          className="size-14 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => removeTop("left")}
          disabled={deck.length === 0}
          aria-label="Descartar"
        >
          <X className="size-6" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-11 rounded-full text-muted-foreground"
          onClick={undo}
          disabled={history.length === 0}
          aria-label="Deshacer"
        >
          <RotateCcw className="size-5" />
        </Button>
        <Button
          size="icon"
          className="bg-trust hover:bg-trust/90 size-14 rounded-full text-trust-foreground"
          onClick={() => removeTop("right")}
          disabled={deck.length === 0}
          aria-label="Guardar"
        >
          <Heart className="size-6" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-center"
    >
      <ShieldCheck className="text-muted-foreground size-10" />
      <p className="text-muted-foreground max-w-[220px] text-sm">
        No hay más vehículos verificados por ahora. Volvé más tarde o ajustá tus filtros.
      </p>
    </motion.div>
  );
}

function SwipeCard({
  vehicle,
  stackIndex,
  isTop,
  onDecide,
}: {
  vehicle: VehicleSummary;
  stackIndex: number;
  isTop: boolean;
  onDecide: (direction: SwipeDirection) => void;
}) {
  const [exiting, setExiting] = React.useState<SwipeDirection | null>(null);

  const handleDragEnd = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) => {
    const passedDistance = Math.abs(info.offset.x) > SWIPE_THRESHOLD;
    const passedVelocity = Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;

    if (passedDistance || passedVelocity) {
      const direction: SwipeDirection = info.offset.x > 0 ? "right" : "left";
      setExiting(direction);
      window.setTimeout(() => onDecide(direction), 220);
    }
  };

  const stackAnimate = {
    x: 0,
    scale: 1 - stackIndex * 0.05,
    y: stackIndex * 12,
    opacity: 1,
    rotate: 0,
  };

  const exitAnimate = exiting
    ? {
        x: exiting === "right" ? 500 : -500,
        rotate: exiting === "right" ? 20 : -20,
        opacity: 0,
      }
    : stackAnimate;

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: VISIBLE_STACK_DEPTH - stackIndex }}
      initial={{ scale: 1 - stackIndex * 0.05, y: stackIndex * 12, opacity: 0 }}
      animate={exitAnimate}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      drag={isTop && !exiting ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileDrag={{ cursor: "grabbing" }}
    >
      <VehicleCard
        vehicle={vehicle}
        className={cn(isTop ? "cursor-grab active:cursor-grabbing" : "")}
      />
    </motion.div>
  );
}
