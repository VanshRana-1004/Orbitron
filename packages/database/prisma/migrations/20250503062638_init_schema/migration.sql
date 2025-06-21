-- CreateTable
CREATE TABLE "otps" (
    "Id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "users" (
    "Id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "skills" TEXT[],
    "profileImage" TEXT,
    "description" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "projects" (
    "Id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "adminId" INTEGER NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "subprojects" (
    "Id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "teamId" INTEGER,

    CONSTRAINT "subprojects_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "teams" (
    "Id" SERIAL NOT NULL,
    "subProjectId" INTEGER NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "_TeamMembers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeamMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "otps_email_key" ON "otps"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subprojects_teamId_key" ON "subprojects"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_subProjectId_key" ON "teams"("subProjectId");

-- CreateIndex
CREATE INDEX "_TeamMembers_B_index" ON "_TeamMembers"("B");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subprojects" ADD CONSTRAINT "subprojects_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subprojects" ADD CONSTRAINT "subprojects_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "subprojects"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "teams"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
