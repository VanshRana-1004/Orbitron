-- DropIndex
DROP INDEX "call_slug_key";

-- AlterTable
ALTER TABLE "call" ADD COLUMN     "callingId" TEXT;
