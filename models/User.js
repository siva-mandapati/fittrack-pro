const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    goal: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      default: "",
    },
    daysPerWeek: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    lastWorkoutDate: {
      type: Date,
      default: null,
    },
    workoutStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestWorkoutStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
