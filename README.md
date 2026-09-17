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
| Autenticación | Auth.js (NextAuth v5) con Credentials + JWT, contraseñas con bcrypt |
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
    (auth)/
      login/page.tsx        Inicio de sesión (Credentials)
      register/page.tsx      Alta de cuenta (comprador o concesionaria)
    dealer/
      page.tsx               Dashboard: estado real de verificación (DB)
      onboarding/page.tsx     Wizard KYC conectado a Server Actions + Postgres
    api/auth/[...nextauth]/route.ts   Route handler de Auth.js
    globals.css            Design tokens (light/dark) + Tailwind v4 @theme
    layout.tsx
  components/
    ui/                    Primitivas (Button, Card, Badge, Progress, Select, ...)
    auth/                  LoginForm, RegisterForm (client, llaman a signIn/registerAction)
    layout/
      site-header.tsx        Header con estado de sesión real
    vehicles/
      swipeable-vehicle-card-stack.tsx      Discovery feed "Tinder-style"
      vehicle-card.tsx                      Tarjeta individual de vehículo
      verification-status-badge-panel.tsx   Checklist de confianza documental
    dealership/
      dealership-onboarding-wizard.tsx      Wizard KYC multi-step
  lib/
    auth.ts                Config de Auth.js (Credentials + JWT + bcrypt)
    prisma.ts              Cliente Prisma (singleton)
    utils.ts                cn(), formatArs(), formatKm()
    mock-data.ts             Datos de ejemplo para /demo
    actions/
      auth.ts                 Server Action: registerAction (crea User real)
      dealership.ts            Server Action: submitOnboardingAction (upsert Dealership real)
    validations/
      auth.ts                  Esquemas Zod de login/registro
      dealership.ts            Validación de CUIT + esquemas Zod del onboarding
  types/
    vehicle.ts               Tipos de dominio (independientes de Prisma)
    verification.ts          Tipos y helpers de verificación documental
    next-auth.d.ts            Extiende Session/JWT con role y dealershipId
  proxy.ts                  Protege /dealer/* (redirige a /login o a "/" según rol)
prisma/
  schema.prisma             Modelo de datos completo
  migrations/                Migración inicial aplicada contra Postgres
```

### Rutas pendientes de implementar (fuera del alcance de este pase)

- `(dealer)/listings/new` — alta minimalista: fotos + patente → dispara verificación.
- `(buyer)/discover` — envuelve `SwipeableVehicleCardStack` con datos reales y paginación.
- `(buyer)/vehiculos/[id]` — ficha pública con `VerificationStatusBadgePanel`.
- `(admin)/dealerships` — cola de revisión manual de KYC (aprobar/rechazar).
- `api/webhooks/mercadopago`, `api/webhooks/afip` — webhooks de pagos/facturación.
- `api/verifications/[vehicleId]` — dispara/consulta el pipeline de verificación real (hoy es 100% mock).
- Subida real de archivos (hoy el wizard solo guarda el nombre del archivo elegido, no lo sube a ningún storage).

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

## Autenticación y acceso por niveles

Login/registro con **Auth.js v5** (`Credentials` + estrategia JWT, sin
adapter de base de datos: el `authorize()` consulta `User` directamente y
compara la contraseña con `bcryptjs`). El rol y el `dealershipId` viajan en
el JWT y quedan expuestos en `session.user` (tipado en
`src/types/next-auth.d.ts`).

- **Registro** (`registerAction`, en `src/lib/actions/auth.ts`): crea un
  `User` real con `role: BUYER` o `role: DEALER_OWNER` según lo elegido. Si
  es concesionaria, el registro **no** crea todavía la `Dealership` (el CUIT,
  campo único obligatorio, recién se conoce en el wizard); el usuario queda
  con `dealershipId: null` hasta completar el onboarding.
- **Onboarding** (`submitOnboardingAction`, en `src/lib/actions/dealership.ts`):
  valida sesión + rol, hace `upsert` de la `Dealership` con los datos reales
  del formulario, crea/actualiza sus `DealershipDocument` y dispara un
  `AuditLog`. Deja el estado en `DOCS_SUBMITTED`.
- **Tiered access**: `src/proxy.ts` (el archivo `proxy.ts`, ex-`middleware.ts`
  desde Next.js 16) protege `/dealer/*`: sin sesión redirige a `/login`, con
  un rol que no sea `DEALER_OWNER`/`DEALER_STAFF` redirige a `/`. El
  dashboard (`/dealer`) además deshabilita el botón "Publicar un vehículo"
  mientras `dealership.status !== "VERIFIED"`, que es la regla de negocio de
  "las cuentas no verificadas no pueden publicar".

Falta: pasar `DOCS_SUBMITTED → IN_REVIEW → VERIFIED` (hoy no hay panel de
admin ni verificación automática real contra AFIP/DNRPA que dispare ese
cambio de estado).

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
cp .env.example .env   # completar DATABASE_URL y generar AUTH_SECRET
npm run prisma:migrate # crea las tablas en tu Postgres
npm run dev             # http://localhost:3000
npm run build
npm run lint
```

Generar un `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Este pase se probó de punta a punta contra un Postgres 16 real (registro →
onboarding → filas reales de `Dealership`/`DealershipDocument`/`AuditLog` →
dashboard reflejando el estado), no solo con mocks en memoria.
