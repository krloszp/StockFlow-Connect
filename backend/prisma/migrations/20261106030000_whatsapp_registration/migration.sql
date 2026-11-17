ALTER TABLE "Customer" ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "WhatsAppSession" (
    "phone" TEXT NOT NULL PRIMARY KEY,
    "step" TEXT NOT NULL,
    "pendingName" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
