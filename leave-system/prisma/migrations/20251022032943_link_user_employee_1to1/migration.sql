-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "empNo" TEXT NOT NULL,
    "prefix" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "idCard" TEXT,
    "org" TEXT,
    "department" TEXT,
    "division" TEXT,
    "unit" TEXT,
    "levelP" TEXT,
    "lineId" TEXT,
    "startDate" TIMESTAMP(3),
    "weeklyHoliday" TEXT,
    "vacationDays" INTEGER NOT NULL DEFAULT 0,
    "businessDays" INTEGER NOT NULL DEFAULT 0,
    "sickDays" INTEGER NOT NULL DEFAULT 0,
    "ordainDays" INTEGER NOT NULL DEFAULT 0,
    "maternityDays" INTEGER NOT NULL DEFAULT 0,
    "unpaidDays" INTEGER NOT NULL DEFAULT 0,
    "birthdayDays" INTEGER NOT NULL DEFAULT 0,
    "annualHolidays" INTEGER NOT NULL DEFAULT 0,
    "photoUrl" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_empNo_key" ON "Employee"("empNo");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_idCard_key" ON "Employee"("idCard");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_empNo_idx" ON "Employee"("empNo");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
