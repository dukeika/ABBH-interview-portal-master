// server/src/routes/interviews.js
import express from "express";
import path from "path";
import prisma from "../db/prisma.js";
import { requireCandidate } from "../middleware/auth.js";
import { makeVideoUploader } from "../config/uploads.js";

const router = express.Router();
const videoUpload = makeVideoUploader();

/**
 * Guard: candidate must own the interview
 * Attaches the interview to req.interview
 */
async function ensureOwnsInterview(req, res, next) {
  try {
    const interviewId = req.params.id;
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: true },
    });
    if (!interview)
      return res.status(404).json({ error: "Interview not found" });
    if (
      !interview.application?.candidateId ||
      interview.application.candidateId !== req.user.id
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.interview = interview;
    return next();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * Wrap multer to return JSON errors (400) instead of crashing the route.
 */
const uploadVideo = (req, res, next) => {
  const mw = videoUpload.single("file");
  mw(req, res, (err) => {
    if (err) {
      // e.g., wrong MIME or too large
      return res.status(400).json({ error: err.message || "Upload error" });
    }
    next();
  });
};

/**
 * GET /api/interviews/:id
 * Returns interview, job, questions; includes existing answers for WRITTEN.
 */
router.get("/:id", requireCandidate, ensureOwnsInterview, async (req, res) => {
  try {
    const interview = req.interview;
    const job = await prisma.job.findUnique({ where: { id: interview.jobId } });

    // Determine which questions to show:
    const assigned = interview.assignedQuestionIds;
    const where =
      assigned && Array.isArray(assigned) && assigned.length
        ? { id: { in: assigned } }
        : {
            jobId: interview.jobId,
            forStage: interview.type === "VIDEO" ? "VIDEO" : "WRITTEN",
          };

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: { id: true, text: true, type: true },
    });

    // For written interviews, include any previously saved answers.
    let answers = [];
    if (interview.type === "WRITTEN") {
      answers = await prisma.answer.findMany({
        where: { interviewId: interview.id },
        select: { questionId: true, answer: true },
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
      questions,
      answers,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load interview" });
  }
});

/**
 * POST /api/interviews/:id/answers/batch
 * Body: { answers: [{ questionId, answer }] }
 * Saves written answers atomically (delete+insert), validates questions belong to job and WRITTEN stage.
 */
router.post(
  "/:id/answers/batch",
  requireCandidate,
  ensureOwnsInterview,
  async (req, res) => {
    try {
      const interview = req.interview;
      if (interview.type !== "WRITTEN") {
        return res.status(400).json({ error: "Not a written interview" });
      }

      const payload = Array.isArray(req.body?.answers) ? req.body.answers : [];
      if (!payload.length) return res.json({ ok: true });

      const qids = payload.map((x) => String(x.questionId));

      // Validate: questions belong to the same job and are for WRITTEN stage.
      const validIds = new Set(
        (
          await prisma.question.findMany({
            where: {
              id: { in: qids },
              jobId: interview.jobId,
              forStage: "WRITTEN",
            },
            select: { id: true },
          })
        ).map((x) => x.id)
      );

      if (qids.some((id) => !validIds.has(id))) {
        return res
          .status(400)
          .json({ error: "Invalid question for this interview" });
      }

      // Save atomically: delete existing for those qids, then create many.
      await prisma.$transaction([
        prisma.answer.deleteMany({
          where: { interviewId: interview.id, questionId: { in: qids } },
        }),
        prisma.answer.createMany({
          data: payload.map((x) => ({
            interviewId: interview.id,
            questionId: String(x.questionId),
            answer: String(x.answer ?? ""),
          })),
        }),
      ]);

      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to save answers" });
    }
  }
);

/**
 * POST /api/interviews/:id/video/upload
 * multipart/form-data: file, questionId
 * Enforces:
 *  - Interview type is VIDEO
 *  - questionId belongs to job & VIDEO stage
 *  - If interview has assignedQuestionIds, questionId must be in the list
 *  - Max 3 attempts per question (per interview)
 */
router.post(
  "/:id/video/upload",
  requireCandidate,
  ensureOwnsInterview,
  uploadVideo,
  async (req, res) => {
    try {
      const interview = req.interview;
      if (interview.type !== "VIDEO") {
        return res.status(400).json({ error: "Not a video interview" });
      }

      const { questionId } = req.body || {};
      if (!questionId)
        return res.status(400).json({ error: "questionId is required" });
      if (!req.file) return res.status(400).json({ error: "file is required" });

      // Validate question belongs to this job & stage VIDEO
      const q = await prisma.question.findFirst({
        where: {
          id: String(questionId),
          jobId: interview.jobId,
          forStage: "VIDEO",
        },
        select: { id: true },
      });
      if (!q)
        return res
          .status(400)
          .json({ error: "Invalid questionId for this interview" });

      // If assigned list exists, question must be part of it
      const assigned = interview.assignedQuestionIds;
      if (
        Array.isArray(assigned) &&
        assigned.length &&
        !assigned.includes(String(questionId))
      ) {
        return res
          .status(400)
          .json({ error: "Question not assigned to this interview" });
      }

      // Attempts by compound unique on (interviewId, questionId)
      const existing = await prisma.videoResponse.findUnique({
        where: {
          interviewId_questionId: {
            interviewId: interview.id,
            questionId: String(questionId),
          },
        },
        select: { id: true, attemptCount: true },
      });
      const nextAttempt = (existing?.attemptCount ?? 0) + 1;
      if (nextAttempt > 3) {
        return res.status(400).json({ error: "Max attempts reached (3)" });
      }

      // Always store a web URL (posix) regardless of OS path
      const relPath = path.posix.join(
        "/uploads",
        "videos",
        interview.id,
        path.basename(req.file.path)
      );

      const payload = {
        filePath: relPath,
        attemptCount: nextAttempt,
        createdAt: new Date(),
      };

      if (existing) {
        await prisma.videoResponse.update({
          where: { id: existing.id },
          data: payload,
        });
      } else {
        await prisma.videoResponse.create({
          data: {
            interviewId: interview.id,
            questionId: String(questionId),
            ...payload,
          },
        });
      }

      return res.json({ filePath: relPath, attemptCount: nextAttempt });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);

/**
 * POST /api/interviews/:id/submit
 * Marks interview as submitted.
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
