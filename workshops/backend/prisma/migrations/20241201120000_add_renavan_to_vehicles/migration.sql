-- AlterTable
ALTER TABLE "customer_vehicles" ADD COLUMN "renavan" VARCHAR(11);

-- CreateIndex
CREATE INDEX "customer_vehicles_renavan_idx" ON "customer_vehicles"("renavan");

-- CreateIndex
CREATE UNIQUE INDEX "customer_vehicles_customerId_renavan_key" ON "customer_vehicles"("customerId", "renavan");

