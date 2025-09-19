/*
  Warnings:

  - Changed the type of `recorded` on the `call` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "call" DROP COLUMN "recorded",
ADD COLUMN     "recorded" BOOLEAN NOT NULL;
