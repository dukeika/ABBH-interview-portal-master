const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

// Public list roles
router.get("/", async (_req, res) => {
  const roles = await prisma.jobRole.findMany({
    select: { id: true, title: true, description: true },
  });
  res.json(roles);
});

// Questions for a role by type
router.get("/:id/questions", async (req, res) => {
  const id = Number(req.params.id);
  const type = req.query.type === "VIDEO" ? "VIDEO" : "WRITTEN";
  const questions = await prisma.question.findMany({
    where: { jobRoleId: id, type },
    orderBy: { order: "asc" },
    select: { id: true, text: true, order: true },
  });
  res.json(questions);
});

// HR: create/update/delete roles & questions
router.post("/", auth(), requireRole("HR"), async (req, res) => {
  const { title, description } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });
  const role = await prisma.jobRole.create({ data: { title, description } });
  res.json(role);
});

router.post("/:id/questions", auth(), requireRole("HR"), async (req, res) => {
  const jobRoleId = Number(req.params.id);
  const { type, text, order = 0 } = req.body || {};
  if (!type || !text)
    return res.status(400).json({ error: "type and text required" });
  const q = await prisma.question.create({
    data: { jobRoleId, type, text, order },
  });
  res.json(q);
});

router.delete(
  "/questions/:qid",
  auth(),
  requireRole("HR"),
  async (req, res) => {
    const qid = Number(req.params.qid);
    await prisma.question.delete({ where: { id: qid } });
    res.json({ ok: true });
  }
);

module.exports = router;
