/*
  Warnings:

  - Made the column `order` on table `Question` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prompt` on table `Question` required. This step will fail if there are existing NULL values in that column.
  - Made the column `applicationId` on table `VideoResponse` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "text" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OPEN',
    "forStage" TEXT NOT NULL DEFAULT 'WRITTEN',
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("createdAt", "forStage", "id", "jobId", "order", "prompt", "text", "type") SELECT "createdAt", "forStage", "id", "jobId", "order", "prompt", "text", "type" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE TABLE "new_VideoResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'video/webm',
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "questionId" TEXT,
    "interviewId" TEXT,
    "filePath" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VideoResponse_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VideoResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VideoResponse_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VideoResponse" ("applicationId", "attemptCount", "createdAt", "durationMs", "endedAt", "filePath", "id", "interviewId", "mimeType", "questionId", "startedAt") SELECT "applicationId", "attemptCount", "createdAt", "durationMs", "endedAt", "filePath", "id", "interviewId", "mimeType", "questionId", "startedAt" FROM "VideoResponse";
DROP TABLE "VideoResponse";
ALTER TABLE "new_VideoResponse" RENAME TO "VideoResponse";
CREATE INDEX "VideoResponse_applicationId_idx" ON "VideoResponse"("applicationId");
CREATE INDEX "VideoResponse_questionId_idx" ON "VideoResponse"("questionId");
CREATE INDEX "VideoResponse_interviewId_idx" ON "VideoResponse"("interviewId");
CREATE UNIQUE INDEX "VideoResponse_applicationId_questionId_key" ON "VideoResponse"("applicationId", "questionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
