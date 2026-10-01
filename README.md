# Cartuccia Automotores — panel de ventas

App de gestión de ventas para una concesionaria de autos en Argentina. El
administrador carga los datos del comprador, del vendedor y del auto, y la app
genera todos los papeles de la operación, listos para imprimir o guardar en PDF:

- Boleto de compraventa (por duplicado)
- Recibos de seña y de pagos (original + duplicado, numerados)
- Factura A, B o C (letra elegida automáticamente según la condición de IVA)
- Hoja con los datos para el Formulario 08
- Acta de entrega del vehículo

Además lleva el stock de autos con fotos tomadas desde el celular y genera
las imágenes para Instagram con el diseño de la agencia.

## Stack

| Capa | Elección |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4, tokens de diseño en `src/app/globals.css` |
| Componentes UI | Primitivas estilo shadcn/ui (`src/components/ui`) + controles propios (`src/components/dealer/campo.tsx`) |
| Animación | Framer Motion (transiciones del asistente de venta) |
| Base de datos | PostgreSQL (Neon) vía Prisma ORM |
| Autenticación | Auth.js (NextAuth v5) con Credentials + JWT, contraseñas con bcrypt |

## Estructura

```
src/
  app/
    page.tsx                         Portada pública para clientes (info, video, autos, WhatsApp)
    (auth)/login, (auth)/register    Acceso de la concesionaria
    dealer/
      onboarding/page.tsx            Datos de la concesionaria que salen en los papeles
      (panel)/                       Panel con navegación (lateral / inferior en celular)
        page.tsx                     Inicio: accesos rápidos, indicadores, operaciones en curso
        operaciones/nueva            Asistente de venta en 4 pasos con vista previa del boleto
        operaciones/[id]             Carpeta: recibos, factura (CAE), entrega, trámites
        operaciones/[id]/imprimir    ?doc=boleto|recibo|factura|f08|entrega|todo
        stock, stock/nuevo, stock/[id]
        ajustes                      Punto de venta, IIBB, inicio de actividades
        stock/[id]/posteo            Posteo de Instagram "Nuevo Ingreso" / "Usados" / "0 km"
        operaciones/[id]/posteo      Posteo de Instagram "Nueva Entrega"
    api/vehiculos/[id]/fotos         Subida de fotos (POST)
    api/fotos/[id]                   Sirve una foto guardada en la base (GET)
  components/
    dealer/                          Asistente, formularios, galería, carpeta, navegación
    documentos/documentos.tsx        Boleto, Recibo, Factura, DatosF08, ActaEntrega (A4, con logo y pie de marca)
    dealer/generador-posteo.tsx      Dibuja los posteos en canvas (1080×1350)
  lib/
    sales/                           Reglas puras: letra de factura, IVA, montos en letras, trámites
    actions/                         Server Actions (operaciones, vehículos, concesionaria, auth)
    validations/                     Esquemas Zod
    dealer.ts                        requireDealer() / getDealerOrNull()
    comprimir-imagen.ts              Compresión de fotos en el navegador antes de subir
    marca.ts                         Nombre, eslogan y logos de la agencia
    posteos.ts                       Textos de los posteos con el tono de la agencia
prisma/
  schema.prisma, migrations/
```

## Decisiones

- **Fotos en Postgres**: se comprimen en el navegador (~250 KB, máx. 1600 px)
  y se guardan como `bytea` en `VehiclePhoto.data`. Así alcanza con la base de
  datos gratuita de Neon, sin pagar un storage aparte. `VehiclePhoto.url` queda
  para migrar a un storage externo si algún día hace falta.
- **Factura**: la app arma el comprobante completo. El CAE se obtiene en ARCA
  ("Comprobantes en línea") y se carga en la operación; hasta entonces la
  factura se imprime con la marca "BORRADOR SIN CAE".
- **Vendedor particular**: una operación puede ser de la concesionaria o de un
  particular (consignación). En ese caso no se genera factura del auto.
- **Clientes**: se guardan por DNI/CUIT; al cargar una nueva operación con el
  mismo documento, los datos se autocompletan.

## Desarrollo

```bash
npm install
cp .env.example .env    # completar DATABASE_URL y AUTH_SECRET
npm run prisma:migrate  # crea las tablas
npm run dev             # http://localhost:3000
npm run build
npm run lint
```

Para correr `next start` fuera de Vercel hay que definir `AUTH_TRUST_HOST=true`.

Generar un `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
