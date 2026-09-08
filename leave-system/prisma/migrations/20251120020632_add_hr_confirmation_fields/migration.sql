-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "hrConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hrConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "hrConfirmedBy" TEXT;

-- CreateIndex
CREATE INDEX "Leave_hrConfirmed_idx" ON "Leave"("hrConfirmed");
