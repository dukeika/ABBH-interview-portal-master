const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { authMiddleware } = require("../middleware/auth");

// Candidate: get status
router.get("/application-status", authMiddleware, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { userId: req.user.id },
  });
  res.json(app);
});

// Candidate: written test submission
router.post("/written-test", authMiddleware, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { userId: req.user.id },
  });
  if (app.stage !== 2)
    return res.status(403).json({ error: "Not at written test stage" });

  const test = await prisma.writtenTest.create({
    data: {
      applicationId: app.id,
      answers: req.body.answers,
      submittedAt: new Date(),
    },
  });

  await prisma.application.update({
    where: { id: app.id },
    data: { stage: 3 }, // Move to next stage
  });

  res.json(test);
});

// Candidate: video submission
router.post("/video-submissions", authMiddleware, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { userId: req.user.id },
  });
  if (app.stage !== 3)
    return res.status(403).json({ error: "Not at video stage" });

  const sub = await prisma.videoSubmission.create({
    data: {
      applicationId: app.id,
      videoPath: req.body.videoPath,
      submittedAt: new Date(),
    },
  });

  await prisma.application.update({
    where: { id: app.id },
    data: { stage: 4 },
  });

  res.json(sub);
});

// Candidate: get final link
router.get("/final-link", authMiddleware, async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { userId: req.user.id },
  });
  if (app.stage < 4)
    return res.status(403).json({ error: "Final stage not reached" });
  res.json({ finalLink: app.finalLink });
});

module.exports = router;
