const mongoose = require("mongoose");

const workoutEntrySchema = new mongoose.Schema(
  {
    exerciseName: {
      type: String,
      required: true,
      trim: true,
    },
    setsCompleted: {
      type: Number,
      required: true,
      min: 0,
    },
    repsCompleted: {
      type: Number,
      required: true,
      min: 0,
    },
    weightUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    difficulty: {
      type: String,
      required: true,
      trim: true,
    },
    oneRM: {
      type: Number,
      default: 0,
      min: 0,
    },
    suggestedNextWeight: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const workoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    entries: {
      type: [workoutEntrySchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one workout entry is required.",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkoutLog", workoutLogSchema);
