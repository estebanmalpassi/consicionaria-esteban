-- CreateEnum
CREATE TYPE "IvaCondition" AS ENUM ('CONSUMIDOR_FINAL', 'RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('RESERVADA', 'VENDIDA', 'ENTREGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CONTADO', 'TRANSFERENCIA', 'FINANCIADO', 'PERMUTA', 'MIXTO');

-- AlterTable
ALTER TABLE "Dealership" ADD COLUMN     "activityStartDate" TEXT,
ADD COLUMN     "grossIncomeNumber" TEXT,
ADD COLUMN     "pointOfSale" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "engineNumber" TEXT,
ADD COLUMN     "purchasePriceArs" DECIMAL(14,2),
ALTER COLUMN "fuelType" SET DEFAULT 'NAFTA',
ALTER COLUMN "transmission" SET DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "VehiclePhoto" ADD COLUMN     "data" BYTEA,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "mimeType" TEXT,
ALTER COLUMN "url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'DNI',
    "docNumber" TEXT NOT NULL,
    "ivaCondition" "IvaCondition" NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
    "nationality" TEXT,
    "maritalStatus" TEXT,
    "birthDate" TEXT,
    "occupation" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'VENDIDA',
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceArs" DECIMAL(14,2) NOT NULL,
    "depositArs" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CONTADO',
    "paymentNotes" TEXT,
    "tradeInDescription" TEXT,
    "tradeInPatente" TEXT,
    "tradeInValueArs" DECIMAL(14,2),
    "deliveryDate" TIMESTAMP(3),
    "deliveryKm" INTEGER,
    "invoiceType" "InvoiceType",
    "ivaRate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "invoiceNumber" INTEGER,
    "afipCae" TEXT,
    "afipCaeExpiry" TEXT,
    "checklist" JSONB,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountArs" DECIMAL(14,2) NOT NULL,
    "concept" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CONTADO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_dealershipId_idx" ON "Customer"("dealershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_dealershipId_docNumber_key" ON "Customer"("dealershipId", "docNumber");

-- CreateIndex
CREATE INDEX "Sale_dealershipId_idx" ON "Sale"("dealershipId");

-- CreateIndex
CREATE INDEX "Sale_vehicleId_idx" ON "Sale"("vehicleId");

-- CreateIndex
CREATE INDEX "Sale_buyerId_idx" ON "Sale"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_dealershipId_number_key" ON "Sale"("dealershipId", "number");

-- CreateIndex
CREATE INDEX "Receipt_saleId_idx" ON "Receipt"("saleId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
