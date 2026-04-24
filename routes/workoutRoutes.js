const express = require("express");
const {
  logWorkout,
  getWorkoutHistory,
  deleteWorkoutSession,
  exportWorkoutHistoryCsv,
} = require("../controllers/workoutController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/log", protect, logWorkout);
router.get("/history/:userId", protect, getWorkoutHistory);
router.delete("/session/:sessionId", protect, deleteWorkoutSession);
router.get("/history/export/:userId", protect, exportWorkoutHistoryCsv);

module.exports = router;
