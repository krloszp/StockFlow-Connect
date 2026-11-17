ALTER TABLE "CustomerPayment" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'EFECTIVO';
ALTER TABLE "SaleItem" ADD COLUMN "costPriceAtSale" REAL NOT NULL DEFAULT 0;
UPDATE "SaleItem" SET "costPriceAtSale" = (SELECT "costPrice" FROM "Product" WHERE "Product"."id" = "SaleItem"."productId");
