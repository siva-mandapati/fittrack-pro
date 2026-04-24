const mongoose = require("mongoose");

const dailyMetricsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    steps: {
      type: Number,
      required: true,
      min: 0,
    },
    caloriesConsumed: {
      type: Number,
      required: true,
      min: 0,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    heartRate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyMetrics", dailyMetricsSchema);
