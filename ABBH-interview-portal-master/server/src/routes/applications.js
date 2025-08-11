const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const prisma = require("../prisma");
const auth = require("../middleware/auth");

const uploadRoot = process.env.UPLOAD_DIR || "./uploads";
const resumeDir = path.join(uploadRoot, "resumes");
const videoDir = path.join(uploadRoot, "videos");
fs.mkdirSync(resumeDir, { recursive: true });
fs.mkdirSync(videoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === "resume" ? resumeDir : videoDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });

const router = express.Router();

// Create application (candidate)
router.post("/", auth(), upload.single("resume"), async (req, res) => {
  if (req.user.role !== "CANDIDATE")
    return res.status(403).json({ error: "Forbidden" });
  const { jobRoleId, coverLetter } = req.body || {};
  if (!jobRoleId || !req.file)
    return res.status(400).json({ error: "jobRoleId and resume required" });

  const app = await prisma.application.create({
    data: {
      candidateId: req.user.id,
      jobRoleId: Number(jobRoleId),
      resumePath: `/uploads/resumes/${req.file.filename}`,
      coverLetter,
      stage: "APPLIED",
      stageStatus: "PENDING",
      events: {
        create: {
          stage: "APPLIED",
          action: "SUBMITTED",
          actorUserId: req.user.id,
          note: "Application submitted",
        },
      },
    },
  });
  res.json(app);
});

// Get my application
router.get("/me", auth(), async (req, res) => {
  const app = await prisma.application.findFirst({
    where: { candidateId: req.user.id },
    include: {
      jobRole: true,
      answers: { include: { question: true } },
      videos: true,
      events: true,
    },
  });
  res.json(app || null);
});

// Submit written answers
router.post("/:id/written/submit", auth(), async (req, res) => {
  const id = Number(req.params.id);
  const { answers } = req.body || {}; // [{questionId, answerText}]
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.candidateId !== req.user.id)
    return res.status(404).json({ error: "Not found" });

  const create = (answers || []).map((a) => ({
    applicationId: id,
    questionId: Number(a.questionId),
    answerText: a.answerText || "",
  }));
  await prisma.writtenAnswer.createMany({ data: create });
  await prisma.stageEvent.create({
    data: {
      applicationId: id,
      stage: "WRITTEN",
      action: "SUBMITTED",
      actorUserId: req.user.id,
    },
  });
  res.json({ ok: true });
});

// Upload a single video per question
router.post(
  "/:id/video/upload",
  auth(),
  upload.single("video"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { questionId, durationSec } = req.body || {};
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app || app.candidateId !== req.user.id)
      return res.status(404).json({ error: "Not found" });
    if (!req.file || !questionId)
      return res
        .status(400)
        .json({ error: "video file and questionId required" });

    const vs = await prisma.videoSubmission.create({
      data: {
        applicationId: id,
        questionId: Number(questionId),
        videoPath: `/uploads/videos/${req.file.filename}`,
        durationSec: durationSec ? Number(durationSec) : null,
      },
    });
    res.json(vs);
  }
);

module.exports = router;
