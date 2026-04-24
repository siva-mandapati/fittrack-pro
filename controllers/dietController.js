const DietPlan = require("../models/DietPlan");

const updateDietPlan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { caloriesTarget, protein, carbs, fats } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (
      caloriesTarget === undefined ||
      protein === undefined ||
      carbs === undefined ||
      fats === undefined
    ) {
      return res.status(400).json({
        message: "caloriesTarget, protein, carbs, and fats are required.",
      });
    }

    const updatedPlan = await DietPlan.findOneAndUpdate(
      { user: userId },
      { caloriesTarget, protein, carbs, fats },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Diet plan updated successfully.",
      dietPlan: updatedPlan,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update diet plan.", error: error.message });
  }
};

const getDietPlanByUserId = async (req, res) => {
  try {
    const requesterId = req.user?.id;
    const { userId } = req.params;

    if (!requesterId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (requesterId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const dietPlan = await DietPlan.findOne({ user: userId });
    if (!dietPlan) {
      return res.status(404).json({ message: "Diet plan not found." });
    }

    return res.status(200).json({ dietPlan });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch diet plan.", error: error.message });
  }
};

module.exports = {
  updateDietPlan,
  getDietPlanByUserId,
};
