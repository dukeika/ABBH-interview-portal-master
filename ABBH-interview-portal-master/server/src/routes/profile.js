const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");

const router = express.Router();

// Update my profile (fullName, phone)
router.post("/", auth(), async (req, res) => {
  const { fullName, phone } = req.body || {};
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { fullName: fullName || null, phone: phone || null },
  });
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
  });
});

module.exports = router;
