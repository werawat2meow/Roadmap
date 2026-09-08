-- CreateTable
CREATE TABLE "LeaveRight" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "vacation" INTEGER NOT NULL DEFAULT 0,
    "business" INTEGER NOT NULL DEFAULT 0,
    "sick" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRight_level_key" ON "LeaveRight"("level");

-- CreateIndex
CREATE INDEX "LeaveRight_level_idx" ON "LeaveRight"("level");
