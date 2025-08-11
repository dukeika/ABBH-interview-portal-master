router.patch("/applications/:id/stage", adminMiddleware, async (req, res) => {
  const { stage, finalLink } = req.body;
  const updateData = {};
  if (stage) updateData.stage = stage;
  if (finalLink) updateData.finalLink = finalLink;

  const app = await prisma.application.update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.json(app);
});
