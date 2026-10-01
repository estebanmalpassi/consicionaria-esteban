# Estado del proyecto — Concesionaria Esteban

> Este archivo es un resumen para retomar el trabajo en una conversación
> nueva con Claude sin tener que reexplicar todo desde cero. Pegá el
> contenido de este archivo (o decile a Claude que lo lea) al empezar.

## Qué es esto

**Agencia**: Cartuccia Automotores — Fray Mamerto Esquiú 57, Berrotarán,
Córdoba (Instagram `@automotores_cartuccia`). Fundada por Osvaldo
Cartuccia hace más de 25 años; Javier Cartuccia la dirige con él desde 2018.
La marca (nombre, eslogan, logo) está en `src/lib/marca.ts` y los logos en
`public/marca/`. Colores: azul noche + dorado.

App interna y sencilla para que el administrador de la concesionaria haga
**los papeles de una venta de auto**. Carga los datos del comprador, del
vendedor y del auto, y la app genera el boleto de compraventa, los recibos,
la hoja de datos del Formulario 08 y el acta de entrega, listos para
imprimir. También lleva el stock de autos con fotos.

Pedido original de Esteban (audio, septiembre 2026): "no hacer nada como una
concesionaria grande, sino solamente la generación del contrato de
compraventa de forma automática; nada de escanear la tarjeta verde; algo
sencillo con una base de datos gratis que después se pueda ampliar; y que
también le quede un recibo cuando le pagan".

> En octubre 2026 se **sacó todo lo de marketplace** (feed tipo Tinder,
> `/demo`, landing pública, cuentas de comprador y el registro KYC con
> documentos AFIP). Las tablas del marketplace siguen en el schema de Prisma
> (`SwipeAction`, `SavedListing`, `VehicleVerification`, `Subscription`,
> `Invoice`, `DealershipDocument`) pero ningún código las usa; se pueden
> borrar con una migración cuando se decida.

- **Repo**: `estebanmalpassi/consicionaria-esteban` (rama `main`)
- **Stack**: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma +
  Postgres (Neon) + Auth.js v5. Detalle en `README.md`.

## Cómo funciona

1. `/` es la **portada pública para clientes**: logo, "Más de 25 años de
   trayectoria", servicios, historia, video vertical, autos disponibles
   (los del stock con fotos y sin vender, sin precio: botón "Consultar" a
   WhatsApp), ubicación y WhatsApp flotante. "Acceso equipo" lleva al login.
   - **Video**: `public/video/inicio.mp4` + `inicio.webm` + `inicio.jpg`
     (poster). Hoy es un video de muestra armado con posteos de Instagram;
     para cambiarlo se reemplazan esos 3 archivos (mismo nombre).
   - Textos, WhatsApp, Instagram y dirección en `src/lib/marca.ts`.
2. **Acceso solo con código de invitación** (variable `CODIGO_INVITACION` en
   Vercel; sin ella el registro está cerrado).
   - La **primera** cuenta que se registra es la dueña: carga los datos de la
     agencia en `/dealer/onboarding`. Las siguientes entran como **empleados**
     del mismo panel.
   - La "agencia" es la primera concesionaria registrada (o la del CUIT de
     `CUIT_AGENCIA`, si se configura). Cualquier otra cuenta ve `/sin-acceso`
     y sus autos no salen en la portada.
   - En **Ajustes → Equipo** el dueño ve quién tiene acceso, puede **quitar
     acceso** y **hacer dueño** a otro (el anterior queda como empleado).
   - Plan acordado: el desarrollador (Mauri) se registra primero y prueba;
     después Javier se registra con el código y Mauri le pasa la propiedad
     con "Hacer dueño".
3. Panel `/dealer` (barra inferior tipo app en el celular):
   - `operaciones/nueva` — asistente de 4 pasos (auto → vendedor →
     comprador → pago) con vista previa del boleto en vivo. Autocompleta
     clientes por DNI.
   - `operaciones/[id]` — carpeta: recibos numerados por cada pago, datos
     entrega y checklist de trámites con % de avance.
   - `operaciones/[id]/imprimir` — boleto (por duplicado, **mismo formato y
     cláusulas que el boleto en papel de la agencia**, formulario NOR-PAC:
     encabezado con lugar/fecha/partes, 1º objeto, 2º condiciones de pago,
     3º posesión, 4º mora, 5º gastos de transferencia y plazo, 6º otra),
     recibo simple con membrete (original + duplicado), datos del 08 y acta
     de entrega. **No hay factura**: Esteban pidió solo recibo, sin cuestiones
     fiscales.
   - `stock` — autos con fotos (comprimidas en el navegador y guardadas en
     la misma base de datos, sin storage pago), margen y "Compartir ficha"
     por WhatsApp.
   - `ajustes` — datos de la agencia que salen en los papeles.
   - `stock/[id]/posteo` y `operaciones/[id]/posteo` — **generador de
     posteos de Instagram** con el diseño de la agencia ("Nuevo Ingreso",
     "Usados Seleccionados", "0 km", "Nueva Entrega", "Felicitaciones"):
     foto + recuadro azul + escudo, 1080×1350, dibujado en el navegador
     (canvas). Se descarga o se comparte directo desde el celular, con la
     descripción sugerida para copiar.

## Qué falta / ideas para ampliar

- Usuarios empleados (`DEALER_STAFF`) invitados por el dueño.
- Firma digital del boleto / envío por WhatsApp del PDF.
- Que un abogado o escribano revise el texto modelo del boleto.

## Deploy online

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
  - `AUTH_SECRET` = una clave aleatoria. **Nunca escribirla en el repo**:
    se guarda solo en Vercel (Settings → Environment Variables). Para
    generar una nueva:
    `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    o en https://generate-secret.vercel.app/32
- **Build Command a overridear en Vercel**: `npx prisma migrate deploy && next build`
  (corre las migraciones de Prisma contra Neon antes de buildear)

### Cómo se publica

Todo lo que entra a `main` se publica solo en Vercel. Las migraciones nuevas
de Prisma se aplican solas en Neon, porque el Build Command corre
`npx prisma migrate deploy` antes de buildear.

## Cómo retomar

En una conversación nueva con Claude, decile algo como:

> "Estoy trabajando en el repo estebanmalpassi/consicionaria-esteban, leé
> ESTADO_DEL_PROYECTO.md para el contexto y seguimos con [lo que
> necesites]."
