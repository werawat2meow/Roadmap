-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_approverId_fkey";

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Approver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
