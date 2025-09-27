-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileImage" TEXT,
    "oauth" BOOLEAN NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "callingId" TEXT NOT NULL,
    "ended" BOOLEAN NOT NULL,
    "recorded" BOOLEAN NOT NULL,
    "startTime" TEXT NOT NULL,
    "date" TEXT NOT NULL,

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
CREATE TABLE "RecordedCalls" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "duration" TEXT NOT NULL,

    CONSTRAINT "RecordedCalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" SERIAL NOT NULL,
    "callId" INTEGER NOT NULL,
    "clipNumber" INTEGER NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "callusertime_userId_idx" ON "callusertime"("userId");

-- CreateIndex
CREATE INDEX "callusertime_callId_idx" ON "callusertime"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "callusertime_userId_callId_key" ON "callusertime"("userId", "callId");

-- CreateIndex
CREATE INDEX "Clip_callId_clipNumber_idx" ON "Clip"("callId", "clipNumber");

-- CreateIndex
CREATE INDEX "_UserToCall_B_index" ON "_UserToCall"("B");

-- AddForeignKey
ALTER TABLE "callusertime" ADD CONSTRAINT "callusertime_callId_fkey" FOREIGN KEY ("callId") REFERENCES "call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "callusertime" ADD CONSTRAINT "callusertime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_callId_fkey" FOREIGN KEY ("callId") REFERENCES "RecordedCalls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToCall" ADD CONSTRAINT "_UserToCall_A_fkey" FOREIGN KEY ("A") REFERENCES "call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToCall" ADD CONSTRAINT "_UserToCall_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
