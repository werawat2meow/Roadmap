-- CreateTable
CREATE TABLE "Approver" (
    "id" SERIAL NOT NULL,
    "prefix" TEXT,
    "firstNameTh" TEXT NOT NULL,
    "lastNameTh" TEXT NOT NULL,
    "firstNameEn" TEXT,
    "lastNameEn" TEXT,
    "empNo" TEXT NOT NULL,
    "citizenId" TEXT,
    "org" TEXT,
    "department" TEXT,
    "division" TEXT,
    "unit" TEXT,
    "level" TEXT,
    "lineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Approver_empNo_key" ON "Approver"("empNo");

-- CreateIndex
CREATE UNIQUE INDEX "Approver_citizenId_key" ON "Approver"("citizenId");
