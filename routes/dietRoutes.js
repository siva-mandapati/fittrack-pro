const express = require("express");
const { updateDietPlan, getDietPlanByUserId } = require("../controllers/dietController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/update", protect, updateDietPlan);
router.get("/:userId", protect, getDietPlanByUserId);

module.exports = router;
