-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "annual_price" DECIMAL(10,2) NOT NULL,
    "service_orders_limit" INTEGER,
    "parts_limit" INTEGER,
    "users_limit" INTEGER,
    "features" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "highlight_text" VARCHAR(50),
    "stripe_price_id_monthly" VARCHAR(255),
    "stripe_price_id_annual" VARCHAR(255),
    "stripe_product_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- CreateIndex
CREATE INDEX "plans_sort_order_idx" ON "plans"("sort_order");

-- AlterTable - Add planId to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN "plan_id" TEXT;

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default plans
INSERT INTO "plans" ("id", "code", "name", "description", "monthly_price", "annual_price", "service_orders_limit", "parts_limit", "users_limit", "features", "is_active", "is_default", "sort_order", "highlight_text", "created_at", "updated_at")
VALUES 
    (gen_random_uuid(), 'workshops_starter', 'Starter', 'Para pequenas oficinas que estão começando', 99.00, 990.00, 50, 100, 3, ARRAY['basic_service_orders', 'basic_customers'], true, true, 1, NULL, NOW(), NOW()),
    (gen_random_uuid(), 'workshops_professional', 'Professional', 'Para oficinas em crescimento', 299.00, 2990.00, 500, 1000, 10, ARRAY['basic_service_orders', 'basic_customers', 'advanced_reports', 'multiple_locations', 'api_access'], true, false, 2, 'Popular', NOW(), NOW()),
    (gen_random_uuid(), 'workshops_enterprise', 'Enterprise', 'Para grandes operações com necessidades avançadas', 999.00, 9990.00, NULL, NULL, NULL, ARRAY['basic_service_orders', 'basic_customers', 'advanced_reports', 'multiple_locations', 'api_access', 'white_label', 'priority_support', 'custom_integrations'], true, false, 3, NULL, NOW(), NOW());

