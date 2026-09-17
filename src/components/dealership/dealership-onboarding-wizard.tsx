"use client";

import * as React from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  CheckCircle2,
  FileText,
  Landmark,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AFIP_CONDITION_LABELS,
  ARGENTINE_PROVINCES,
  dealershipOnboardingSchema,
  type DealershipOnboardingValues,
} from "@/lib/validations/dealership";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  { id: "business", title: "Datos del negocio", icon: Building2 },
  { id: "afip", title: "Vinculación AFIP", icon: Landmark },
  { id: "documents", title: "Documentación", icon: FileText },
  { id: "review", title: "Revisión", icon: ShieldCheck },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const STEP_FIELDS: Record<StepId, FieldPath<DealershipOnboardingValues>[]> = {
  business: [
    "legalName",
    "tradeName",
    "cuit",
    "afipConditionIva",
    "addressStreet",
    "addressCity",
    "province",
    "postalCode",
    "phone",
  ],
  afip: ["afipDelegationAccepted", "afipCredentialId"],
  documents: ["cuitConstanciaUrl", "legalIdUrl"],
  review: [],
};

export interface DealershipOnboardingWizardProps {
  onSubmit?: (values: DealershipOnboardingValues) => Promise<void> | void;
  className?: string;
}

/**
 * Multi-step KYC wizard: business/fiscal data → AFIP credential delegation →
 * legal document uploads → review & submit for admin/automated approval.
 * Accounts remain unverified (and cannot publish listings) until this
 * completes and the resulting Dealership status reaches VERIFIED.
 */
export function DealershipOnboardingWizard({
  onSubmit,
  className,
}: DealershipOnboardingWizardProps) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const step = STEPS[stepIndex];

  const form = useForm<DealershipOnboardingValues>({
    resolver: zodResolver(dealershipOnboardingSchema),
    mode: "onBlur",
    defaultValues: {
      legalName: "",
      tradeName: "",
      cuit: "",
      afipConditionIva: "RESPONSABLE_INSCRIPTO",
      addressStreet: "",
      addressCity: "",
      province: "",
      postalCode: "",
      phone: "",
      website: "",
      afipCredentialId: "",
      cuitConstanciaUrl: "",
      legalIdUrl: "",
      businessLicenseUrl: "",
    },
  });

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step.id]);
    if (!valid) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleFinalSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await onSubmit?.(values);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  });

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  if (submitted) {
    return <OnboardingSuccess className={className} />;
  }

  return (
    <Card className={cn("w-full max-w-2xl gap-6 py-6", className)}>
      <CardHeader className="gap-4">
        <div>
          <CardTitle className="text-xl">Verificación de la concesionaria</CardTitle>
          <CardDescription>
            Completá estos pasos para habilitar la publicación de vehículos. Un
            equipo humano y validaciones automáticas contra AFIP revisan cada
            cuenta antes de aprobarla.
          </CardDescription>
        </div>

        <div className="flex flex-col gap-2">
          <Progress value={progress} />
          <div className="flex justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
              return (
                <div key={s.id} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                      state === "done" && "border-trust bg-trust-muted text-trust",
                      state === "active" && "border-primary bg-primary text-primary-foreground",
                      state === "todo" && "border-border text-muted-foreground"
                    )}
                  >
                    {state === "done" ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <span className="hidden text-[11px] text-muted-foreground sm:block">
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            {step.id === "business" && <BusinessStep form={form} />}
            {step.id === "afip" && <AfipStep form={form} />}
            {step.id === "documents" && <DocumentsStep form={form} />}
            {step.id === "review" && <ReviewStep form={form} />}
          </motion.div>
        </AnimatePresence>

        <Separator className="my-6" />

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0}>
            Atrás
          </Button>
          {step.id === "review" ? (
            <Button type="button" onClick={handleFinalSubmit} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Enviar para verificación
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Continuar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

function BusinessStep({ form }: { form: ReturnType<typeof useForm<DealershipOnboardingValues>> }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const condition = watch("afipConditionIva");
  const province = watch("province");

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="legalName">Razón social</Label>
          <Input id="legalName" placeholder="Concesionaria Esteban S.R.L." {...register("legalName")} />
          <FieldError message={errors.legalName?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tradeName">Nombre comercial</Label>
          <Input id="tradeName" placeholder="Concesionaria Esteban" {...register("tradeName")} />
          <FieldError message={errors.tradeName?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cuit">CUIT</Label>
          <Input id="cuit" placeholder="30-71234567-9" {...register("cuit")} />
          <FieldError message={errors.cuit?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label>Condición frente al IVA</Label>
          <RadioGroup
            value={condition}
            onValueChange={(v) => setValue("afipConditionIva", v as DealershipOnboardingValues["afipConditionIva"], { shouldValidate: true })}
            className="grid-flow-col gap-3"
          >
            {Object.entries(AFIP_CONDITION_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={value} />
                {label}
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="col-span-2 grid gap-1.5">
          <Label htmlFor="addressStreet">Domicilio fiscal</Label>
          <Input id="addressStreet" placeholder="Av. Colón 1234" {...register("addressStreet")} />
          <FieldError message={errors.addressStreet?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="addressCity">Localidad</Label>
          <Input id="addressCity" placeholder="Córdoba" {...register("addressCity")} />
          <FieldError message={errors.addressCity?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label>Provincia</Label>
          <Select
            value={province}
            onValueChange={(v) => setValue("province", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná una provincia" />
            </SelectTrigger>
            <SelectContent>
              {ARGENTINE_PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.province?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="postalCode">Código postal</Label>
          <Input id="postalCode" placeholder="X5000" {...register("postalCode")} />
          <FieldError message={errors.postalCode?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" placeholder="+54 351 555-0100" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
      </div>
    </div>
  );
}

function AfipStep({ form }: { form: ReturnType<typeof useForm<DealershipOnboardingValues>> }) {
  const { watch, setValue, formState: { errors } } = form;
  const linked = Boolean(watch("afipCredentialId"));
  const accepted = watch("afipDelegationAccepted");

  return (
    <div className="grid gap-5">
      <div className="bg-muted/50 flex flex-col gap-3 rounded-lg border p-4">
        <p className="text-sm">
          Para validar automáticamente el Formulario 08, Título, Tarjeta Verde,
          Libre de Deuda e Informe de Dominio de cada vehículo publicado,
          necesitamos una delegación de solo lectura de tu Clave Fiscal
          (servicio &quot;Autos&quot; de AFIP/ARCA). Nunca almacenamos tu contraseña.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            checked={accepted === true}
            onChange={(e) => setValue("afipDelegationAccepted", e.target.checked as true, { shouldValidate: true })}
          />
          Autorizo el acceso de solo lectura a los servicios de consulta vehicular de AFIP.
        </label>
        <FieldError message={errors.afipDelegationAccepted?.message as string | undefined} />
      </div>

      <Button
        type="button"
        variant={linked ? "trust" : "default"}
        className="w-fit"
        disabled={!accepted}
        onClick={() =>
          setValue("afipCredentialId", `afip_cred_${Date.now()}`, { shouldValidate: true })
        }
      >
        {linked ? <CheckCircle2 className="size-4" /> : <Landmark className="size-4" />}
        {linked ? "Clave Fiscal vinculada" : "Conectar con Clave Fiscal"}
      </Button>
      <FieldError message={errors.afipCredentialId?.message} />
    </div>
  );
}

function DocumentsStep({ form }: { form: ReturnType<typeof useForm<DealershipOnboardingValues>> }) {
  const { watch, setValue, formState: { errors } } = form;

  return (
    <div className="grid gap-4">
      <UploadField
        label="Constancia de Inscripción AFIP"
        value={watch("cuitConstanciaUrl")}
        onChange={(name) => setValue("cuitConstanciaUrl", name, { shouldValidate: true })}
        error={errors.cuitConstanciaUrl?.message}
      />
      <UploadField
        label="DNI del representante legal"
        value={watch("legalIdUrl")}
        onChange={(name) => setValue("legalIdUrl", name, { shouldValidate: true })}
        error={errors.legalIdUrl?.message}
      />
      <UploadField
        label="Habilitación comercial (opcional)"
        value={watch("businessLicenseUrl")}
        onChange={(name) => setValue("businessLicenseUrl", name)}
      />
    </div>
  );
}

function UploadField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value?: string;
  onChange: (fileName: string) => void;
  error?: string;
}) {
  const inputId = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors hover:bg-muted/50",
          value && "border-trust/50 bg-trust-muted/40"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {value ? <CheckCircle2 className="text-trust size-4 shrink-0" /> : <Upload className="size-4 shrink-0" />}
          <span className="truncate">{value || "Hacé clic para subir un archivo (PDF o imagen)"}</span>
        </span>
        <span className="text-muted-foreground shrink-0 text-xs">Examinar</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file.name);
        }}
      />
      <FieldError message={error} />
    </div>
  );
}

function ReviewStep({ form }: { form: ReturnType<typeof useForm<DealershipOnboardingValues>> }) {
  const values = form.watch();
  const rows: [string, string][] = [
    ["Razón social", values.legalName],
    ["Nombre comercial", values.tradeName],
    ["CUIT", values.cuit],
    ["Condición IVA", AFIP_CONDITION_LABELS[values.afipConditionIva]],
    ["Domicilio", `${values.addressStreet}, ${values.addressCity}, ${values.province}`],
    ["Teléfono", values.phone],
    ["Clave Fiscal", values.afipCredentialId ? "Vinculada" : "Sin vincular"],
    ["Constancia AFIP", values.cuitConstanciaUrl || "—"],
    ["DNI representante", values.legalIdUrl || "—"],
  ];

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-sm">
        Revisá los datos antes de enviarlos. Tu cuenta quedará en estado{" "}
        <span className="font-medium text-foreground">&quot;En revisión&quot;</span> hasta que
        se confirmen las validaciones automáticas y, si corresponde, un
        administrador la apruebe manualmente.
      </p>
      <dl className="divide-y rounded-lg border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function OnboardingSuccess({ className }: { className?: string }) {
  return (
    <Card className={cn("w-full max-w-2xl items-center gap-4 py-12 text-center", className)}>
      <div className="bg-trust-muted flex size-16 items-center justify-center rounded-full">
        <ShieldCheck className="text-trust size-8" />
      </div>
      <CardTitle className="text-xl">Solicitud enviada</CardTitle>
      <CardDescription className="max-w-sm">
        Tu concesionaria quedó en estado <strong>En revisión</strong>. Te
        avisaremos por email apenas se validen los datos ante AFIP y se
        habilite la publicación de vehículos.
      </CardDescription>
    </Card>
  );
}
