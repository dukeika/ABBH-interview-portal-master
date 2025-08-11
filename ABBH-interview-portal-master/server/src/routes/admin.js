const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { nextStage, prevStage } = require("../utils/stage"); // ← update import

const router = express.Router();

// List applications
router.get("/applications", auth(), requireRole("HR"), async (req, res) => {
  const list = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: { candidate: true, jobRole: true },
  });
  res.json(list);
});

// Application details
router.get("/applications/:id", auth(), requireRole("HR"), async (req, res) => {
  const id = Number(req.params.id);
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      candidate: true,
      jobRole: true,
      answers: { include: { question: true } },
      videos: { include: { question: true } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!app) return res.status(404).json({ error: "Not found" });
  res.json(app);
});

// Approve or reject current stage
router.post(
  "/applications/:id/decision",
  auth(),
  requireRole("HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { decision, note } = req.body || {}; // 'APPROVE' | 'REJECT'
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ error: "Not found" });

    const stageStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const updated = await prisma.application.update({
      where: { id },
      data: { stageStatus },
    });
    await prisma.stageEvent.create({
      data: {
        applicationId: id,
        stage: app.stage,
        action: decision,
        actorUserId: req.user.id,
        note,
      },
    });
    res.json(updated);
  }
);

// Move to next stage (resets status to PENDING)
router.post(
  "/applications/:id/advance",
  auth(),
  requireRole("HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ error: "Not found" });

    const ns = nextStage(app.stage);
    const updated = await prisma.application.update({
      where: { id },
      data: { stage: ns, stageStatus: "PENDING" },
    });
    await prisma.stageEvent.create({
      data: {
        applicationId: id,
        stage: ns,
        action: "MOVED",
        actorUserId: req.user.id,
        note: "Advanced to next stage",
      },
    });
    res.json(updated);
  }
);

// Move to previous stage (resets status to PENDING)
router.post(
  "/applications/:id/revert",
  auth(),
  requireRole("HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ error: "Not found" });

    const ps = prevStage(app.stage);
    if (ps === app.stage) {
      return res.status(400).json({ error: "Already at earliest stage" });
    }

    const data = { stage: ps, stageStatus: "PENDING" };

    // Optional: clear final link if leaving FINAL to avoid confusing the candidate
    if (app.stage === "FINAL" && ps !== "FINAL") data.finalInterviewLink = null;

    const updated = await prisma.application.update({ where: { id }, data });

    await prisma.stageEvent.create({
      data: {
        applicationId: id,
        stage: ps,
        action: "MOVED_BACK",
        actorUserId: req.user.id,
        note: "Reverted to previous stage",
      },
    });

    res.json(updated);
  }
);

// Set final interview link
router.post(
  "/applications/:id/final-link",
  auth(),
  requireRole("HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { link } = req.body || {};
    const updated = await prisma.application.update({
      where: { id },
      data: { finalInterviewLink: link || null },
    });
    await prisma.stageEvent.create({
      data: {
        applicationId: id,
        stage: "FINAL",
        action: "UPDATED_LINK",
        actorUserId: req.user.id,
        note: link || "",
      },
    });
    res.json(updated);
  }
);

module.exports = router;
