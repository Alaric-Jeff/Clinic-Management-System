/*
  Warnings:

  - You are about to drop the `Accounts_Table` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patients_Table` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Services_Table` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ServiceCategory" AS ENUM ('hematology', 'bacteriology', 'clinical_microscopy', 'twenty_four_hour_urine_test', 'serology_immunology', 'clinical_chemistry', 'electrolytes', 'vaccine', 'histopathology', 'to_be_read_by_pathologist', 'tumor_markers', 'thyroid_function_test', 'hormones', 'hepatitis', 'enzymes', 'others');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('activated', 'deactivated', 'pending');

-- DropTable
DROP TABLE "public"."Accounts_Table";

-- DropTable
DROP TABLE "public"."Patients_Table";

-- DropTable
DROP TABLE "public"."Services_Table";

-- DropEnum
DROP TYPE "public"."Service_Categories";

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT DEFAULT 'N/A',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'encoder',
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'deactivated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT DEFAULT 'N/A',
    "birthDate" TIMESTAMP(3) NOT NULL,
    "csdIdOrPwdId" TEXT,
    "mobileNumber" TEXT,
    "residentialAddress" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."ServiceCategory" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActivated" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "public"."Account"("email");

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "public"."Account"("email");

-- CreateIndex
CREATE INDEX "Account_role_idx" ON "public"."Account"("role");

-- CreateIndex
CREATE INDEX "Account_status_idx" ON "public"."Account"("status");

-- CreateIndex
CREATE INDEX "Patient_createdById_idx" ON "public"."Patient"("createdById");

-- CreateIndex
CREATE INDEX "Patient_updatedById_idx" ON "public"."Patient"("updatedById");

-- CreateIndex
CREATE INDEX "Patient_isArchived_idx" ON "public"."Patient"("isArchived");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "public"."Service"("category");

-- CreateIndex
CREATE INDEX "Service_isActivated_idx" ON "public"."Service"("isActivated");

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
