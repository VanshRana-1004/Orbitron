/*
  Warnings:

  - You are about to drop the column `createdAt` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the `_TeamMembers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subprojects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_TeamMembers" DROP CONSTRAINT "_TeamMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "_TeamMembers" DROP CONSTRAINT "_TeamMembers_B_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_adminId_fkey";

-- DropForeignKey
ALTER TABLE "subprojects" DROP CONSTRAINT "subprojects_adminId_fkey";

-- DropForeignKey
ALTER TABLE "subprojects" DROP CONSTRAINT "subprojects_projectId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_subProjectId_fkey";

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "createdAt";

-- DropTable
DROP TABLE "_TeamMembers";

-- DropTable
DROP TABLE "projects";

-- DropTable
DROP TABLE "subprojects";

-- DropTable
DROP TABLE "teams";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "profileImage" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callusertime" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "callId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "callusertime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatdata" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "callId" INTEGER NOT NULL,
    "timeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chat" TEXT NOT NULL,

    CONSTRAINT "chatdata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserToCall" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserToCall_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "call_slug_key" ON "call"("slug");

-- CreateIndex
CREATE INDEX "callusertime_userId_idx" ON "callusertime"("userId");

-- CreateIndex
CREATE INDEX "callusertime_callId_idx" ON "callusertime"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "callusertime_userId_callId_key" ON "callusertime"("userId", "callId");

-- CreateIndex
CREATE INDEX "chatdata_userId_idx" ON "chatdata"("userId");

-- CreateIndex
CREATE INDEX "chatdata_callId_idx" ON "chatdata"("callId");

-- CreateIndex
CREATE INDEX "_UserToCall_B_index" ON "_UserToCall"("B");

-- AddForeignKey
ALTER TABLE "callusertime" ADD CONSTRAINT "callusertime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callusertime" ADD CONSTRAINT "callusertime_callId_fkey" FOREIGN KEY ("callId") REFERENCES "call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatdata" ADD CONSTRAINT "chatdata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatdata" ADD CONSTRAINT "chatdata_callId_fkey" FOREIGN KEY ("callId") REFERENCES "call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToCall" ADD CONSTRAINT "_UserToCall_A_fkey" FOREIGN KEY ("A") REFERENCES "call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToCall" ADD CONSTRAINT "_UserToCall_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
