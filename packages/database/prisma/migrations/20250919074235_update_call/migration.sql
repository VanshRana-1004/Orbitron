/*
  Warnings:

  - You are about to drop the column `finish` on the `call` table. All the data in the column will be lost.
  - The `recorded` column on the `call` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "call" DROP COLUMN "finish",
DROP COLUMN "recorded",
ADD COLUMN     "recorded" INTEGER NOT NULL DEFAULT 0;
