ALTER TABLE "PurchaseItem" ADD COLUMN "expirationDate" DATETIME;
UPDATE "PurchaseItem" SET "expirationDate" = (SELECT "expirationDate" FROM "Product" WHERE "Product"."id" = "PurchaseItem"."productId");
