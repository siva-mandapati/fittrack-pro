const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { initializeSocket } = require("./sockets");
const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const dietRoutes = require("./routes/dietRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const progressRoutes = require("./routes/progressRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://fittrack-pro-xi.vercel.app',
    'https://fittrack-e062elvjc-siva-mandapatis-projects.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/diet", dietRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Gym Action API is running" });
});

const PORT = process.env.PORT || 5000;

initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
