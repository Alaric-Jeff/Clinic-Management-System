/*
  Warnings:

  - You are about to drop the `payment_resolutions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."payment_resolutions" DROP CONSTRAINT "payment_resolutions_medicalBillId_fkey";

-- DropTable
DROP TABLE "public"."payment_resolutions";

-- DropEnum
DROP TYPE "public"."ResolutionStatus";
