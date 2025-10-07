-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'encoder');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "public"."ServiceCategory" AS ENUM ('hematology', 'bacteriology', 'clinical_microscopy', 'twenty_four_hour_urine_test', 'serology_immunology', 'clinical_chemistry', 'electrolytes', 'vaccine', 'histopathology', 'to_be_read_by_pathologist', 'tumor_markers', 'thyroid_function_test', 'hormones', 'hepatitis', 'enzymes', 'others');

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('activated', 'deactivated', 'pending');

-- CreateEnum
CREATE TYPE "public"."DocumentationStatus" AS ENUM ('complete', 'incomplete', 'draft');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('paid', 'unpaid', 'partially_paid');

-- CreateEnum
CREATE TYPE "public"."ResolutionStatus" AS ENUM ('pending', 'resolved', 'cancelled');

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT DEFAULT 'N/A',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'encoder',
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."doctors" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleInitial" TEXT,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT DEFAULT 'N/A',
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender" NOT NULL,
    "csdIdOrPwdId" TEXT,
    "mobileNumber" TEXT,
    "residentialAddress" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdByName" TEXT NOT NULL,
    "updatedByName" TEXT,
    "createdByRole" "public"."Role" NOT NULL,
    "updatedByRole" "public"."Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."ServiceCategory" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActivated" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdByName" TEXT,
    "updatedByName" TEXT,
    "createdByRole" "public"."Role",
    "updatedByRole" "public"."Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_documentations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "admittedById" TEXT,
    "createdByName" TEXT NOT NULL,
    "createdByRole" "public"."Role" NOT NULL,
    "admittedByName" TEXT,
    "lastUpdatedByName" TEXT,
    "lastUpdatedByRole" "public"."Role",
    "assessment" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "prescription" TEXT,
    "status" "public"."DocumentationStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_documentations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."billed_services" (
    "id" TEXT NOT NULL,
    "medicalBillId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "serviceCategory" "public"."ServiceCategory" NOT NULL,
    "servicePriceAtTime" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billed_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_bills" (
    "id" TEXT NOT NULL,
    "medicalDocumentationId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "createdByName" TEXT NOT NULL,
    "createdByRole" "public"."Role" NOT NULL,
    "lastUpdatedByName" TEXT,
    "lastUpdatedByRole" "public"."Role",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_history" (
    "id" TEXT NOT NULL,
    "medicalBillId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "recordedByName" TEXT NOT NULL,
    "recordedByRole" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_resolutions" (
    "id" TEXT NOT NULL,
    "medicalBillId" TEXT NOT NULL,
    "originalBalance" DOUBLE PRECISION NOT NULL,
    "agreedPaymentPlan" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "public"."ResolutionStatus" NOT NULL DEFAULT 'pending',
    "resolutionNotes" TEXT,
    "createdByName" TEXT NOT NULL,
    "createdByRole" "public"."Role" NOT NULL,
    "resolvedByName" TEXT,
    "resolvedByRole" "public"."Role",
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_sales_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "totalBills" INTEGER NOT NULL DEFAULT 0,
    "totalServices" INTEGER NOT NULL DEFAULT 0,
    "paidBills" INTEGER NOT NULL DEFAULT 0,
    "unpaidBills" INTEGER NOT NULL DEFAULT 0,
    "partiallyPaidBills" INTEGER NOT NULL DEFAULT 0,
    "averageBillAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_sales_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_daily_analytics" (
    "id" TEXT NOT NULL,
    "dailyAnalyticsId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "serviceCategory" "public"."ServiceCategory" NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "averagePrice" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_daily_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_daily_analytics" (
    "id" TEXT NOT NULL,
    "dailyAnalyticsId" TEXT NOT NULL,
    "category" "public"."ServiceCategory" NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "totalServices" INTEGER NOT NULL DEFAULT 0,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_daily_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_audit_logs" (
    "id" TEXT NOT NULL,
    "medicalDocumentationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldsChanged" TEXT NOT NULL,
    "previousData" TEXT,
    "newData" TEXT,
    "changedByName" TEXT NOT NULL,
    "changedByRole" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "public"."accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_email_idx" ON "public"."accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_role_idx" ON "public"."accounts"("role");

-- CreateIndex
CREATE INDEX "accounts_status_idx" ON "public"."accounts"("status");

-- CreateIndex
CREATE INDEX "patients_isArchived_idx" ON "public"."patients"("isArchived");

-- CreateIndex
CREATE INDEX "patients_createdAt_idx" ON "public"."patients"("createdAt");

-- CreateIndex
CREATE INDEX "patients_lastName_idx" ON "public"."patients"("lastName");

-- CreateIndex
CREATE INDEX "patients_gender_idx" ON "public"."patients"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "public"."services"("name");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "public"."services"("category");

-- CreateIndex
CREATE INDEX "services_isActivated_idx" ON "public"."services"("isActivated");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "public"."services"("name");

-- CreateIndex
CREATE INDEX "medical_documentations_patientId_idx" ON "public"."medical_documentations"("patientId");

-- CreateIndex
CREATE INDEX "medical_documentations_createdById_idx" ON "public"."medical_documentations"("createdById");

-- CreateIndex
CREATE INDEX "medical_documentations_admittedById_idx" ON "public"."medical_documentations"("admittedById");

-- CreateIndex
CREATE INDEX "medical_documentations_status_idx" ON "public"."medical_documentations"("status");

-- CreateIndex
CREATE INDEX "billed_services_medicalBillId_idx" ON "public"."billed_services"("medicalBillId");

-- CreateIndex
CREATE INDEX "billed_services_serviceId_idx" ON "public"."billed_services"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_bills_medicalDocumentationId_key" ON "public"."medical_bills"("medicalDocumentationId");

-- CreateIndex
CREATE INDEX "medical_bills_medicalDocumentationId_idx" ON "public"."medical_bills"("medicalDocumentationId");

-- CreateIndex
CREATE INDEX "medical_bills_paymentStatus_idx" ON "public"."medical_bills"("paymentStatus");

-- CreateIndex
CREATE INDEX "medical_bills_createdAt_idx" ON "public"."medical_bills"("createdAt");

-- CreateIndex
CREATE INDEX "payment_history_medicalBillId_idx" ON "public"."payment_history"("medicalBillId");

-- CreateIndex
CREATE INDEX "payment_history_createdAt_idx" ON "public"."payment_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_resolutions_medicalBillId_key" ON "public"."payment_resolutions"("medicalBillId");

-- CreateIndex
CREATE INDEX "payment_resolutions_medicalBillId_idx" ON "public"."payment_resolutions"("medicalBillId");

-- CreateIndex
CREATE INDEX "payment_resolutions_status_idx" ON "public"."payment_resolutions"("status");

-- CreateIndex
CREATE INDEX "payment_resolutions_dueDate_idx" ON "public"."payment_resolutions"("dueDate");

-- CreateIndex
CREATE INDEX "daily_sales_analytics_date_idx" ON "public"."daily_sales_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sales_analytics_date_key" ON "public"."daily_sales_analytics"("date");

-- CreateIndex
CREATE INDEX "service_daily_analytics_dailyAnalyticsId_idx" ON "public"."service_daily_analytics"("dailyAnalyticsId");

-- CreateIndex
CREATE INDEX "service_daily_analytics_serviceId_idx" ON "public"."service_daily_analytics"("serviceId");

-- CreateIndex
CREATE INDEX "service_daily_analytics_serviceName_idx" ON "public"."service_daily_analytics"("serviceName");

-- CreateIndex
CREATE UNIQUE INDEX "service_daily_analytics_dailyAnalyticsId_serviceName_key" ON "public"."service_daily_analytics"("dailyAnalyticsId", "serviceName");

-- CreateIndex
CREATE INDEX "category_daily_analytics_dailyAnalyticsId_idx" ON "public"."category_daily_analytics"("dailyAnalyticsId");

-- CreateIndex
CREATE INDEX "category_daily_analytics_category_idx" ON "public"."category_daily_analytics"("category");

-- CreateIndex
CREATE UNIQUE INDEX "category_daily_analytics_dailyAnalyticsId_category_key" ON "public"."category_daily_analytics"("dailyAnalyticsId", "category");

-- CreateIndex
CREATE INDEX "document_audit_logs_medicalDocumentationId_idx" ON "public"."document_audit_logs"("medicalDocumentationId");

-- CreateIndex
CREATE INDEX "document_audit_logs_createdAt_idx" ON "public"."document_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "document_audit_logs_changedByName_idx" ON "public"."document_audit_logs"("changedByName");

-- AddForeignKey
ALTER TABLE "public"."medical_documentations" ADD CONSTRAINT "medical_documentations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_documentations" ADD CONSTRAINT "medical_documentations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_documentations" ADD CONSTRAINT "medical_documentations_admittedById_fkey" FOREIGN KEY ("admittedById") REFERENCES "public"."doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billed_services" ADD CONSTRAINT "billed_services_medicalBillId_fkey" FOREIGN KEY ("medicalBillId") REFERENCES "public"."medical_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billed_services" ADD CONSTRAINT "billed_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_bills" ADD CONSTRAINT "medical_bills_medicalDocumentationId_fkey" FOREIGN KEY ("medicalDocumentationId") REFERENCES "public"."medical_documentations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_history" ADD CONSTRAINT "payment_history_medicalBillId_fkey" FOREIGN KEY ("medicalBillId") REFERENCES "public"."medical_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_resolutions" ADD CONSTRAINT "payment_resolutions_medicalBillId_fkey" FOREIGN KEY ("medicalBillId") REFERENCES "public"."medical_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_daily_analytics" ADD CONSTRAINT "service_daily_analytics_dailyAnalyticsId_fkey" FOREIGN KEY ("dailyAnalyticsId") REFERENCES "public"."daily_sales_analytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_daily_analytics" ADD CONSTRAINT "service_daily_analytics_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_daily_analytics" ADD CONSTRAINT "category_daily_analytics_dailyAnalyticsId_fkey" FOREIGN KEY ("dailyAnalyticsId") REFERENCES "public"."daily_sales_analytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_audit_logs" ADD CONSTRAINT "document_audit_logs_medicalDocumentationId_fkey" FOREIGN KEY ("medicalDocumentationId") REFERENCES "public"."medical_documentations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
