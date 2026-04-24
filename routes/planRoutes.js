const express = require("express");
const { generatePlan } = require("../controllers/planController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/generate", protect, generatePlan);

module.exports = router;
