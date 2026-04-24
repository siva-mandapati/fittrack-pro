const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    targetSets: {
      type: Number,
      required: true,
      min: 1,
    },
    targetReps: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const workoutDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
    },
    focus: {
      type: String,
      required: true,
    },
    exercises: {
      type: [exerciseSchema],
      default: [],
    },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    daysPerWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    splitType: {
      type: String,
      required: true,
    },
    plan: {
      type: [workoutDaySchema],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkoutPlan", workoutPlanSchema);
