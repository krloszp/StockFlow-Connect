ALTER TABLE "Product" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "Order" ADD COLUMN "whatsappRequestCode" TEXT;
CREATE UNIQUE INDEX "Order_whatsappRequestCode_key" ON "Order"("whatsappRequestCode");
