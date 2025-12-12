-- CreateTable
CREATE TABLE "job_postings" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "salaryPerHour" INTEGER NOT NULL,
    "energyPerHour" INTEGER NOT NULL DEFAULT 10,
    "maxWorkers" INTEGER NOT NULL DEFAULT 1,
    "currentWorkers" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_employees" (
    "id" SERIAL NOT NULL,
    "jobPostingId" INTEGER NOT NULL,
    "workerId" INTEGER NOT NULL,
    "hoursWorked" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastWorked" TIMESTAMP(3),

    CONSTRAINT "job_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_employees_jobPostingId_workerId_key" ON "job_employees"("jobPostingId", "workerId");

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_employees" ADD CONSTRAINT "job_employees_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_employees" ADD CONSTRAINT "job_employees_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

