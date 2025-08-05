-- CreateTable
CREATE TABLE "ScheduledCalls" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "ScheduledCalls_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "Clip_callId_clipNumber_idx" ON "Clip"("callId", "clipNumber");

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_callId_fkey" FOREIGN KEY ("callId") REFERENCES "RecordedCalls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
