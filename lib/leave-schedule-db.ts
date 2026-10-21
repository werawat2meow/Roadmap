import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForSchedule = globalThis as unknown as {
  leaveScheduleDb?: PrismaClient;
};

export const leaveScheduleDb =
  globalForSchedule.leaveScheduleDb ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForSchedule.leaveScheduleDb = leaveScheduleDb;
}