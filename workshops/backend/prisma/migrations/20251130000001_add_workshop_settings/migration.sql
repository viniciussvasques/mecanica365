-- CreateTable
CREATE TABLE "workshop_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "display_name" VARCHAR(255),
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" VARCHAR(7),
    "secondary_color" VARCHAR(7),
    "accent_color" VARCHAR(7),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "whatsapp" VARCHAR(20),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(2) DEFAULT 'BR',
    "website" VARCHAR(255),
    "facebook" VARCHAR(255),
    "instagram" VARCHAR(255),
    "linkedin" VARCHAR(255),
    "show_logo_on_quotes" BOOLEAN NOT NULL DEFAULT true,
    "show_address_on_quotes" BOOLEAN NOT NULL DEFAULT true,
    "show_contact_on_quotes" BOOLEAN NOT NULL DEFAULT true,
    "quote_footer_text" TEXT,
    "invoice_footer_text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_settings_tenantId_key" ON "workshop_settings"("tenantId");

-- CreateIndex
CREATE INDEX "workshop_settings_tenantId_idx" ON "workshop_settings"("tenantId");

-- AddForeignKey
ALTER TABLE "workshop_settings" ADD CONSTRAINT "workshop_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

