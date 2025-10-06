-- AlterTable
ALTER TABLE "public"."patients" ALTER COLUMN "updatedByName" DROP NOT NULL,
ALTER COLUMN "updatedByRole" DROP NOT NULL;
