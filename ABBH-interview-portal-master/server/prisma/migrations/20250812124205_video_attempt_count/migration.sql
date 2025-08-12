-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VideoResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interviewId" TEXT NOT NULL,
    "questionId" TEXT,
    "filePath" TEXT NOT NULL,
    "durationSec" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VideoResponse_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VideoResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VideoResponse" ("createdAt", "durationSec", "filePath", "id", "interviewId", "questionId") SELECT "createdAt", "durationSec", "filePath", "id", "interviewId", "questionId" FROM "VideoResponse";
DROP TABLE "VideoResponse";
ALTER TABLE "new_VideoResponse" RENAME TO "VideoResponse";
CREATE UNIQUE INDEX "VideoResponse_interviewId_questionId_key" ON "VideoResponse"("interviewId", "questionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
