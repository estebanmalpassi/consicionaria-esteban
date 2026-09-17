"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CircleDashed,
  Clock,
  FileWarning,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  REQUIRED_VERIFICATION_DOCS,
  VERIFICATION_DOC_DESCRIPTIONS,
  VERIFICATION_DOC_LABELS,
  isFullyVerified,
  verificationProgress,
  type VehicleVerificationItem,
  type VerificationStatus,
} from "@/types/verification";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_META: Record<
  VerificationStatus,
  { label: string; icon: React.ElementType; badgeClass: string; dotClass: string }
> = {
  VERIFIED: {
    label: "Verificado",
    icon: BadgeCheck,
    badgeClass: "bg-trust-muted text-trust border-transparent",
    dotClass: "bg-trust",
  },
  IN_PROGRESS: {
    label: "En proceso",
    icon: Clock,
    badgeClass: "bg-warning/15 text-warning-foreground border-transparent",
    dotClass: "bg-warning",
  },
  PENDING: {
    label: "Pendiente",
    icon: CircleDashed,
    badgeClass: "bg-muted text-muted-foreground border-transparent",
    dotClass: "bg-muted-foreground/50",
  },
  FAILED: {
    label: "Rechazado",
    icon: FileWarning,
    badgeClass: "bg-destructive/10 text-destructive border-transparent",
    dotClass: "bg-destructive",
  },
  EXPIRED: {
    label: "Vencido",
    icon: ShieldQuestion,
    badgeClass: "bg-destructive/10 text-destructive border-transparent",
    dotClass: "bg-destructive",
  },
};

export interface VerificationStatusBadgePanelProps {
  items: VehicleVerificationItem[];
  className?: string;
  /** Compact renders only the summary badge, e.g. for a listing card overlay. */
  compact?: boolean;
}

/**
 * Trust & Safety panel: a "Documentation Trust Checklist" that shows, per
 * mandatory legal document, whether the vehicle has been auto-verified.
 * `compact` renders a single summary badge suitable for a card overlay.
 */
export function VerificationStatusBadgePanel({
  items,
  className,
  compact = false,
}: VerificationStatusBadgePanelProps) {
  const fullyVerified = isFullyVerified(items);
  const progress = verificationProgress(items);

  if (compact) {
    return (
      <Badge
        variant={fullyVerified ? "trust" : "secondary"}
        className={cn("gap-1.5 px-2.5 py-1 backdrop-blur", className)}
      >
        {fullyVerified ? (
          <ShieldCheck className="size-3.5" />
        ) : (
          <ShieldQuestion className="size-3.5" />
        )}
        {fullyVerified ? "Verificado" : `${progress}% verificado`}
      </Badge>
    );
  }

  return (
    <Card className={cn("gap-4 py-5", className)}>
      <CardHeader className="px-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {fullyVerified ? (
              <ShieldCheck className="text-trust size-5" />
            ) : (
              <ShieldQuestion className="text-muted-foreground size-5" />
            )}
            Checklist de Documentación
          </CardTitle>
          <Badge variant={fullyVerified ? "trust" : "secondary"}>
            {fullyVerified ? "Transacción segura" : `${progress}%`}
          </Badge>
        </div>
        <Progress
          value={progress}
          className="mt-1"
          indicatorClassName={fullyVerified ? "bg-trust" : undefined}
        />
      </CardHeader>

      <CardContent className="flex flex-col gap-1 px-5">
        {REQUIRED_VERIFICATION_DOCS.map((docType) => {
          const item = items.find((i) => i.docType === docType);
          const status = item?.status ?? "PENDING";
          const meta = STATUS_META[status];
          const Icon = meta.icon;

          return (
            <Tooltip key={docType}>
              <TooltipTrigger asChild>
                <motion.div
                  layout
                  className="flex cursor-default items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        meta.badgeClass
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {VERIFICATION_DOC_LABELS[docType]}
                      </p>
                      {item?.provider && (
                        <p className="text-muted-foreground truncate text-xs">
                          Fuente: {item.provider}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={cn("shrink-0", meta.badgeClass)}>{meta.label}</Badge>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="left">
                {VERIFICATION_DOC_DESCRIPTIONS[docType]}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </CardContent>
    </Card>
  );
}
