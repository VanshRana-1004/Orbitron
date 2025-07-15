/*
  Warnings:

  - You are about to drop the column `lastLogin` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `chatdata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chatdata" DROP CONSTRAINT "chatdata_callId_fkey";

-- DropForeignKey
ALTER TABLE "chatdata" DROP CONSTRAINT "chatdata_userId_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "lastLogin",
ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "chatdata";
