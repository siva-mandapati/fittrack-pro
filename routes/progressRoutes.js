const express = require("express");
const {
  analyzeProgress,
  getProgressDashboardStats,
  getWeeklyMuscleGroupVolume,
} = require("../controllers/progressController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/analyze", protect, analyzeProgress);
router.get("/dashboard-stats", protect, getProgressDashboardStats);
router.get("/weekly-muscle-volume", protect, getWeeklyMuscleGroupVolume);

module.exports = router;
