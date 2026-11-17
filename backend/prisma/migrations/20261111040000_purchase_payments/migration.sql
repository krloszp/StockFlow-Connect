CREATE TABLE "PurchasePayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "purchaseId" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchasePayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PurchasePayment_purchaseId_idx" ON "PurchasePayment"("purchaseId");
INSERT INTO "PurchasePayment" ("id", "purchaseId", "amount", "paymentMethod", "note", "createdAt")
SELECT lower(hex(randomblob(16))), "id", "amountPaid", "paymentMethod", 'Pago inicial', "createdAt"
FROM "Purchase" WHERE "amountPaid" > 0;
