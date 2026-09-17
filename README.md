# Concesionaria Esteban

Marketplace y SaaS para concesionarias de autos en Argentina. La propuesta de
valor central es la **seguridad total de la transacción** mediante
verificación automática de la documentación legal de cada vehículo
(Formulario 08, Título, Tarjeta Verde, Libre de Deuda e Informe de Dominio)
antes de que pueda publicarse.

## Stack

| Capa | Elección |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4, tokens de diseño en `src/app/globals.css` |
| Componentes UI | Primitivas estilo shadcn/ui sobre Radix UI (`src/components/ui`) |
| Animación | Framer Motion (stack swipeable, transiciones del wizard) |
| Iconos | Lucide |
| Formularios | React Hook Form + Zod |
| Base de datos | PostgreSQL vía Prisma ORM (`prisma/schema.prisma`) |
| Pagos / facturación | Hooks de integración para Mercado Pago, Stripe y AFIP (a implementar) |

> Nota: el `shadcn` CLI no pudo usarse en este entorno (el host `ui.shadcn.com`
> está bloqueado por la política de red del sandbox), así que las primitivas
> en `src/components/ui` están escritas a mano siguiendo exactamente las
> convenciones de shadcn/ui (mismas clases, mismos data-slots). Son
> intercambiables 1:1 si más adelante se quiere correr el CLI real.

## Estructura de carpetas

```
src/
  app/
    page.tsx              Landing pública
    demo/page.tsx          Vista de referencia de los 3 componentes core
    globals.css            Design tokens (light/dark) + Tailwind v4 @theme
    layout.tsx
  components/
    ui/                    Primitivas (Button, Card, Badge, Progress, Select, ...)
    vehicles/
      swipeable-vehicle-card-stack.tsx      Discovery feed "Tinder-style"
      vehicle-card.tsx                      Tarjeta individual de vehículo
      verification-status-badge-panel.tsx   Checklist de confianza documental
    dealership/
      dealership-onboarding-wizard.tsx      Wizard KYC multi-step
  lib/
    prisma.ts              Cliente Prisma (singleton)
    utils.ts                cn(), formatArs(), formatKm()
    mock-data.ts             Datos de ejemplo para /demo
    validations/
      dealership.ts          Validación de CUIT + esquemas Zod del onboarding
  types/
    vehicle.ts               Tipos de dominio (independientes de Prisma)
    verification.ts          Tipos y helpers de verificación documental
prisma/
  schema.prisma             Modelo de datos completo
```

### Rutas pendientes de implementar (fuera del alcance de este pase)

La estructura de componentes y el schema ya contemplan estos módulos; falta
conectarlos a rutas y lógica de servidor:

- `(dealer)/onboarding` — envuelve `DealershipOnboardingWizard` con Server Actions.
- `(dealer)/listings/new` — alta minimalista: fotos + patente → dispara verificación.
- `(buyer)/discover` — envuelve `SwipeableVehicleCardStack` con datos reales y paginación.
- `(buyer)/vehiculos/[id]` — ficha pública con `VerificationStatusBadgePanel`.
- `(admin)/dealerships` — cola de revisión manual de KYC.
- `api/webhooks/mercadopago`, `api/webhooks/afip` — webhooks de pagos/facturación.
- `api/verifications/[vehicleId]` — dispara/consulta el pipeline de verificación.

## Modelo de datos (Prisma)

`prisma/schema.prisma` cubre:

- **Identidad**: `User` con roles (`BUYER`, `DEALER_OWNER`, `DEALER_STAFF`, `ADMIN`).
- **KYC de concesionarias**: `Dealership` (estado `PENDING → DOCS_SUBMITTED →
  IN_REVIEW → VERIFIED/REJECTED/SUSPENDED`), `DealershipDocument` (CUIT,
  credenciales AFIP, DNI, habilitación comercial).
- **Inventario**: `Vehicle` (clave `patente` única), `VehiclePhoto`.
- **Verificación documental**: `VehicleVerification`, una fila por
  `VerificationDocType` (Formulario 08, Título, Tarjeta Verde, Libre de
  Deuda, Informe de Dominio) con estado, proveedor y payload crudo para
  auditoría.
- **Descubrimiento**: `SwipeAction` (like/pass del feed) y `SavedListing`
  (favoritos explícitos).
- **Billing**: `Subscription` (plan + cupo de publicaciones), `Invoice`
  (Factura A/B/C, CAE de AFIP, proveedor de pago).
- **Fraude/auditoría**: `AuditLog` genérico por actor + entidad.

Para generar el cliente (no requiere DB corriendo):

```bash
npm run prisma:generate
```

Para aplicar migraciones (requiere `DATABASE_URL` en `.env`, ver `.env.example`):

```bash
npm run prisma:migrate
```

## Design system

Tokens en `src/app/globals.css`, con soporte claro/oscuro vía `oklch()` y la
clase `.dark`:

- `--primary`: azul confiable (fintech), usado en acciones principales.
- `--trust` / `--trust-muted`: verde **reservado exclusivamente** para
  estados de verificación (badges, checklist, progreso), para que el color
  mantenga su significado en toda la app.
- `--warning`, `--destructive`: estados en proceso / rechazados.

## Componentes core

### 1. `SwipeableVehicleCardStack`

Feed de descubrimiento estilo Tinder con Framer Motion: drag horizontal,
umbral de distancia/velocidad para decidir like/pass, animación de salida,
botones de acción (pasar / deshacer / guardar) y estado vacío. Solo
renderiza las 3 tarjetas superiores del mazo por performance.

### 2. `VerificationStatusBadgePanel`

Checklist de confianza documental. Modo completo (`Card` con progreso y un
ítem por documento obligatorio) o `compact` (badge único para overlay de
tarjeta). Reutiliza los mismos tipos que el schema de Prisma
(`VerificationDocType`, `VerificationStatus`).

### 3. `DealershipOnboardingWizard`

Wizard KYC de 4 pasos (datos del negocio + domicilio fiscal → vinculación
AFIP → documentación → revisión) con React Hook Form + Zod, incluyendo
validación real de dígito verificador de CUIT
(`src/lib/validations/dealership.ts`).

Ver los tres en funcionamiento en `/demo`.

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint
```
