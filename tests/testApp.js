const express = require("express");
const authRoutes = require("../routes/authRoutes");
const workoutRoutes = require("../routes/workoutRoutes");
const progressRoutes = require("../routes/progressRoutes");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/workout", workoutRoutes);
  app.use("/api/progress", progressRoutes);
  return app;
};

module.exports = createTestApp;
