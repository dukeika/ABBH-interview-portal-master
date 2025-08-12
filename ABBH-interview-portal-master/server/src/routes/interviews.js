import express from "express";
import path from "path";
import prisma from "../db/prisma.js";
import { requireCandidate } from "../middleware/auth.js";
import { makeVideoUploader } from "../config/uploads.js";

const router = express.Router();
const videoUpload = makeVideoUploader();

/** Ensure the requesting candidate owns the interview via application.candidateId */
async function ensureOwnsInterview(req, res, next) {
  const interviewId = req.params.id;
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: true },
  });
  if (!interview) return res.status(404).json({ error: "Interview not found" });
  if (
    !interview.application?.candidateId ||
    interview.application.candidateId !== req.user.id
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.interview = interview;
  return next();
}

/**
 * GET /api/interviews/:id
 * returns: { interview, job, questions: [...] }
 */
router.get("/:id", requireCandidate, ensureOwnsInterview, async (req, res) => {
  const interview = req.interview;
  const job = await prisma.job.findUnique({ where: { id: interview.jobId } });

  // Which questions to show?
  let questions;
  const ids = interview.assignedQuestionIds;
  if (ids && Array.isArray(ids) && ids.length) {
    questions = await prisma.question.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "asc" },
    });
  } else {
    questions = await prisma.question.findMany({
      where: { jobId: interview.jobId, forStage: "VIDEO" },
      orderBy: { createdAt: "asc" },
    });
  }

  return res.json({
    interview: {
      id: interview.id,
      type: interview.type,
      assignedAt: interview.assignedAt,
      submittedAt: interview.submittedAt,
      durationMins: interview.durationMins,
    },
    job: { id: job?.id, title: job?.title },
    questions: questions.map((q) => ({ id: q.id, text: q.text })),
  });
});

/**
 * POST /api/interviews/:id/video/upload
 * multipart/form-data: file, questionId
 */
router.post(
  "/:id/video/upload",
  requireCandidate,
  ensureOwnsInterview,
  videoUpload.single("file"),
  async (req, res) => {
    try {
      const interview = req.interview;
      const { questionId } = req.body;
      if (!questionId)
        return res.status(400).json({ error: "questionId is required" });
      if (!req.file) return res.status(400).json({ error: "file is required" });

      // Validate question belongs to this job and is for VIDEO
      const q = await prisma.question.findFirst({
        where: { id: questionId, jobId: interview.jobId, forStage: "VIDEO" },
        select: { id: true },
      });
      if (!q)
        return res
          .status(400)
          .json({ error: "Invalid questionId for this interview" });

      // If assignedQuestionIds exists, enforce it
      const ids = interview.assignedQuestionIds;
      if (
        ids &&
        Array.isArray(ids) &&
        ids.length &&
        !ids.includes(questionId)
      ) {
        return res
          .status(400)
          .json({ error: "This question was not assigned for this interview" });
      }

      // Normalize URL path with forward slashes for the client
      const relPath = path.posix.join(
        "/uploads",
        "videos",
        interview.id,
        path.basename(req.file.path)
      );

      // Upsert via unique(interviewId, questionId)
      await prisma.videoResponse.upsert({
        where: {
          interviewId_questionId: { interviewId: interview.id, questionId },
        },
        update: { filePath: relPath, createdAt: new Date() },
        create: {
          interviewId: interview.id,
          questionId,
          filePath: relPath,
        },
      });

      return res.json({ filePath: relPath });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

/**
 * POST /api/interviews/:id/submit
 * Marks submittedAt (HR moves to FINAL_CALL later).
 */
router.post(
  "/:id/submit",
  requireCandidate,
  ensureOwnsInterview,
  async (req, res) => {
    try {
      const updated = await prisma.interview.update({
        where: { id: req.interview.id },
        data: { submittedAt: new Date() },
        select: { id: true, submittedAt: true },
      });
      return res.json(updated);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to submit interview" });
    }
  }
);

export default router;
