# Estado del proyecto — Concesionaria Esteban

> Este archivo es un resumen para retomar el trabajo en una conversación
> nueva con Claude sin tener que reexplicar todo desde cero. Pegá el
> contenido de este archivo (o decile a Claude que lo lea) al empezar.

## Qué es esto

Marketplace/SaaS para concesionarias de autos en Argentina. Propuesta de
valor: verificación automática de documentación legal (Formulario 08,
Título, Tarjeta Verde, Libre de Deuda, Informe de Dominio) antes de publicar
un vehículo.

- **Repo**: `estebanmalpassi/consicionaria-esteban` (rama `main`)
- **Stack**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma +
  Auth.js v5 + Framer Motion. Detalle completo en `README.md`.

## Qué ya está construido (código, en el repo)

1. **Design system** — tokens claro/oscuro en `src/app/globals.css`, color
   `trust` (verde) reservado para estados de verificación.
2. **Schema de Prisma completo** (`prisma/schema.prisma`) — usuarios, KYC de
   concesionarias, vehículos, verificación documental, favoritos, billing,
   auditoría. Migración inicial ya generada en `prisma/migrations/`.
3. **Los 3 componentes core**, funcionando y visibles en `/demo`:
   - `SwipeableVehicleCardStack` (feed estilo Tinder)
   - `VerificationStatusBadgePanel` (checklist de confianza documental)
   - `DealershipOnboardingWizard` (wizard KYC de 4 pasos)
4. **Autenticación real** (Auth.js v5, Credentials + JWT, bcrypt):
   - `/register` y `/login`
   - `/dealer/onboarding` — el wizard conectado a una Server Action que crea
     la `Dealership` real en la base de datos
   - `/dealer` — dashboard que lee el estado real (`PENDING` →
     `DOCS_SUBMITTED` → `IN_REVIEW` → `VERIFIED`) y solo habilita "Publicar
     un vehículo" cuando está `VERIFIED`
   - `src/proxy.ts` protege `/dealer/*` por sesión y rol

Todo esto se probó de punta a punta (registro → onboarding → dashboard)
contra un Postgres real, no solo con mocks.

5. **Gestión de ventas y papeles** (pedido de Esteban por audio, octubre 2026):
   "algo sencillo para generar el boleto de compraventa automáticamente,
   cargando datos del comprador, vendedor y auto, y que también quede un
   recibo cuando le pagan". Panel en `/dealer` (barra inferior tipo app en
   el celular):
   - `/dealer/operaciones/nueva` — asistente de 4 pasos (auto → vendedor →
     comprador → pago) con **vista previa del boleto en vivo**. El vendedor
     puede ser la concesionaria o un particular (consignación). Al poner el
     DNI de alguien que ya operó, se autocompletan sus datos.
   - `/dealer/operaciones/[id]` — "carpeta" de la operación: papeles para
     imprimir, pagos con recibo numerado, datos de factura (CAE), entrega y
     checklist de trámites de transferencia con % de avance.
   - `/dealer/operaciones/[id]/imprimir` — boleto (por duplicado), recibo
     (original + duplicado), factura A/B/C (letra automática según IVA,
     "BORRADOR SIN CAE" hasta cargar el CAE), datos para el Formulario 08 y
     acta de entrega. Se imprimen o se guardan en PDF desde el navegador.
     Montos en letras automáticos (`src/lib/sales/numero-a-letras.ts`).
   - `/dealer/stock` — autos con fotos. Las fotos se comprimen en el celular
     y se guardan **en la misma base de datos** (Neon gratis), sin pagar un
     storage aparte. Guía de tomas (frente, lateral, interior...), cámara
     directa en el celular, margen de ganancia y "Compartir ficha" por
     WhatsApp.
   - `/dealer/ajustes` — punto de venta, Ingresos Brutos, inicio de actividades.

   El panel de gestión se habilita apenas se completa el registro de la
   concesionaria (no espera la verificación del marketplace).

## Qué falta (no está implementado todavía)

- Alta de vehículos (`/dealer/listings/new`) — fotos + patente
- Discovery feed conectado a datos reales (`/discover`), hoy el componente
  existe pero solo se ve con mocks en `/demo`
- Ficha pública de vehículo (`/vehiculos/[id]`)
- Panel de admin para aprobar/rechazar concesionarias (pasar de
  `DOCS_SUBMITTED`/`IN_REVIEW` a `VERIFIED`)
- Verificación real contra AFIP/DNRPA (hoy es 100% mock)
- Subida real de archivos (el wizard hoy solo guarda el nombre del archivo)
- Pedir el CAE automáticamente a ARCA/AFIP (Web Service WSFE). Hoy la
  factura se arma sola pero el CAE se pide en "Comprobantes en línea" y se
  carga a mano
- Mercado Pago / Stripe

## Estado del deploy online (en progreso)

El usuario (Mauri/Esteban) no tiene Node.js corriendo sin problemas en su
Windows, así que en vez de correr el proyecto localmente lo estamos
deployando online:

- **Base de datos**: Neon (https://neon.tech), proyecto ya creado:
  `green-meadow-37821606`. Ya se obtuvo la connection string (pooled) desde
  "Connection details" → "Show password" → "Copy snippet".
- **Hosting**: Vercel (https://vercel.com), importando el repo
  `consicionaria-esteban` desde GitHub.
- **Environment variables a cargar en Vercel** (antes de darle a Deploy):
  - `DATABASE_URL` = la connection string de Neon (con la contraseña real)
  - `AUTH_SECRET` = `GxybmpDGQNNw+nDjB0vclkfR7fnKQTV3glrnXLMNQVw=`
    (generado para este proyecto; si se pierde, se puede regenerar con
    `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    pero esta app puede correr en cualquier máquina con Node)
- **Build Command a overridear en Vercel**: `npx prisma migrate deploy && next build`
  (corre las migraciones de Prisma contra Neon antes de buildear)

### Próximo paso pendiente

Confirmar que el deploy en Vercel terminó bien y probar `/register` →
`/dealer/onboarding` → `/dealer` contra la URL pública que da Vercel
(algo como `consicionaria-esteban.vercel.app`).

### Para publicar los cambios nuevos en Vercel

Los cambios están en la rama `claude/dealership-invoice-app-91b5g9`. Vercel
crea solo una versión de prueba (Preview) de esa rama. Para que quede en la
URL principal hay que pasarla a `main` (merge del Pull Request). La
migración nueva (`prisma/migrations/*_operaciones_boleto_recibos_y_fotos`)
se aplica sola en Neon porque el Build Command ya corre
`npx prisma migrate deploy`.

## Cómo retomar

En una conversación nueva con Claude, decile algo como:

> "Estoy trabajando en el repo estebanmalpassi/consicionaria-esteban, leé
> ESTADO_DEL_PROYECTO.md para el contexto y seguimos con [lo que
> necesites]."
