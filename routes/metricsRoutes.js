const express = require("express");
const { createMetrics, getMetricsByUserId } = require("../controllers/metricsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createMetrics);
router.get("/:userId", protect, getMetricsByUserId);

module.exports = router;
