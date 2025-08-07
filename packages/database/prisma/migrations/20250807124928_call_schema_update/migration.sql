/*
  Warnings:

  - Added the required column `ended` to the `call` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recorded` to the `call` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `call` table without a default value. This is not possible if the table is not empty.
  - Made the column `callingId` on table `call` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "call" ADD COLUMN     "ended" BOOLEAN NOT NULL,
ADD COLUMN     "recorded" BOOLEAN NOT NULL,
ADD COLUMN     "startTime" BOOLEAN NOT NULL,
ALTER COLUMN "callingId" SET NOT NULL;
