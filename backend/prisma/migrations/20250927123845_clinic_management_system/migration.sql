-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'encoder');

-- CreateEnum
CREATE TYPE "public"."Service_Categories" AS ENUM ('Hematology', 'Bacteriology', 'ClinicalMicroscopy', 'TwentyFourHourUrineTest', 'SerologyAndImmunology', 'ClinicalChemistry', 'Electrolytes', 'Vaccine', 'Hispatology', 'ToBeReadByPathologist', 'TumorMarkers', 'ThyroidFunctionTest', 'Hormones', 'Hepatitis', 'Enzymes', 'Others');

-- CreateTable
CREATE TABLE "public"."Accounts_Table" (
    "account_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT DEFAULT 'N/A',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'encoder',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accounts_Table_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "public"."Patients_Table" (
    "patient_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT DEFAULT 'N/A',
    "birth_date" TIMESTAMP(3) NOT NULL,
    "csd_id_or_pwd_id" TEXT,
    "mobile_number" TEXT,
    "residentual_address" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "last_updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patients_Table_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "public"."Services_Table" (
    "services_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "service_category" "public"."Service_Categories" NOT NULL,
    "service_price" DOUBLE PRECISION NOT NULL,
    "is_activated" BOOLEAN NOT NULL DEFAULT true,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_by" TEXT NOT NULL,

    CONSTRAINT "Services_Table_pkey" PRIMARY KEY ("services_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_Table_email_key" ON "public"."Accounts_Table"("email");
