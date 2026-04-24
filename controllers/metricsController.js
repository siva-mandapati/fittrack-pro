const DailyMetrics = require("../models/DailyMetrics");

const createMetrics = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { steps, caloriesConsumed, weight, heartRate } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (
      steps === undefined ||
      caloriesConsumed === undefined ||
      weight === undefined ||
      heartRate === undefined
    ) {
      return res.status(400).json({
        message: "steps, caloriesConsumed, weight, and heartRate are required.",
      });
    }

    const metrics = await DailyMetrics.create({
      user: userId,
      steps,
      caloriesConsumed,
      weight,
      heartRate,
    });

    return res.status(201).json({
      message: "Daily metrics saved successfully.",
      metrics,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to save daily metrics.", error: error.message });
  }
};

const getMetricsByUserId = async (req, res) => {
  try {
    const requesterId = req.user?.id;
    const { userId } = req.params;

    if (!requesterId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (requesterId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const metrics = await DailyMetrics.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: metrics.length,
      metrics,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch daily metrics.", error: error.message });
  }
};

module.exports = {
  createMetrics,
  getMetricsByUserId,
};
