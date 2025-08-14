/*
  Warnings:

  - You are about to drop the column `durationSec` on the `VideoResponse` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "durationMins" INTEGER,
    "assignedQuestionIds" JSONB,
    CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Interview" ("applicationId", "assignedAt", "assignedQuestionIds", "durationMins", "id", "jobId", "submittedAt", "type") SELECT "applicationId", "assignedAt", "assignedQuestionIds", "durationMins", "id", "jobId", "submittedAt", "type" FROM "Interview";
DROP TABLE "Interview";
ALTER TABLE "new_Interview" RENAME TO "Interview";
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "prompt" TEXT DEFAULT '',
    "text" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OPEN',
    "forStage" TEXT NOT NULL DEFAULT 'WRITTEN',
    "order" INTEGER DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("createdAt", "forStage", "id", "jobId", "text", "type") SELECT "createdAt", "forStage", "id", "jobId", "text", "type" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE TABLE "new_VideoResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'video/webm',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "questionId" TEXT,
    "interviewId" TEXT,
    "filePath" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VideoResponse_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VideoResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VideoResponse_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VideoResponse" ("attemptCount", "createdAt", "filePath", "id", "interviewId", "questionId") SELECT "attemptCount", "createdAt", "filePath", "id", "interviewId", "questionId" FROM "VideoResponse";
DROP TABLE "VideoResponse";
ALTER TABLE "new_VideoResponse" RENAME TO "VideoResponse";
CREATE INDEX "VideoResponse_applicationId_idx" ON "VideoResponse"("applicationId");
CREATE INDEX "VideoResponse_questionId_idx" ON "VideoResponse"("questionId");
CREATE INDEX "VideoResponse_interviewId_idx" ON "VideoResponse"("interviewId");
CREATE UNIQUE INDEX "VideoResponse_applicationId_questionId_key" ON "VideoResponse"("applicationId", "questionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Answer_interviewId_idx" ON "Answer"("interviewId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");
