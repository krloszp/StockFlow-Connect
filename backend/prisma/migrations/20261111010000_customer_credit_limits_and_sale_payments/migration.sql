ALTER TABLE "Customer" ADD COLUMN "creditLimit" REAL NOT NULL DEFAULT 0;
CREATE TABLE "PaymentAllocation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CustomerPayment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentAllocation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PaymentAllocation_saleId_idx" ON "PaymentAllocation"("saleId");
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");
