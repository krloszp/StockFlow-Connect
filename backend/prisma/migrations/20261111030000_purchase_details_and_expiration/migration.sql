ALTER TABLE "Product" ADD COLUMN "expirationDate" DATETIME;
ALTER TABLE "Purchase" ADD COLUMN "amountPaid" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "purchaseDate" DATETIME;
ALTER TABLE "PurchaseItem" ADD COLUMN "sellingPriceAtPurchase" REAL NOT NULL DEFAULT 0;
UPDATE "Purchase" SET "purchaseDate" = "createdAt", "amountPaid" = "totalAmount";
UPDATE "PurchaseItem" SET "sellingPriceAtPurchase" = COALESCE((SELECT "sellingPrice" FROM "Product" WHERE "Product"."id" = "PurchaseItem"."productId"), 0);
CREATE INDEX "Product_expirationDate_idx" ON "Product"("expirationDate");
CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");
