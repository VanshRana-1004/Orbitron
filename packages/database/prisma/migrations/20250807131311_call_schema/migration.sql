/*
  Warnings:

  - Added the required column `date` to the `call` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "call" ADD COLUMN     "date" BOOLEAN NOT NULL;
