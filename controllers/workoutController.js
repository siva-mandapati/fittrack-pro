const WorkoutLog = require("../models/WorkoutLog");
const User = require("../models/User");

const DIFFICULTY_MET = {
  easy: 3.5,
  medium: 5.0,
  hard: 7.0,
};

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const calculateOneRM = (weightUsed, repsCompleted) => {
  const weight = Number(weightUsed) || 0;
  const reps = Number(repsCompleted) || 0;
  return Number((weight * (1 + reps / 30)).toFixed(2));
};

const normalizeExerciseName = (exerciseName) => String(exerciseName || "").trim().toLowerCase();

const calculateSessionCalories = (entries, userWeight, duration) => {
  const safeDuration = Number(duration) || 30;
  const safeWeight = Number(userWeight) > 0 ? Number(userWeight) : 70;
  const mets =
    entries.length > 0
      ? entries.map((entry) => DIFFICULTY_MET[String(entry.difficulty).toLowerCase()] || 5.0)
      : [5.0];
  const avgMet = mets.reduce((sum, value) => sum + value, 0) / mets.length;
  return Number((avgMet * safeWeight * (safeDuration / 60)).toFixed(2));
};

const logWorkout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { entries, duration = 45 } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res
        .status(400)
        .json({ message: "entries must be a non-empty array." });
    }

    const hasInvalidEntry = entries.some((entry) => {
      const {
        exerciseName,
        setsCompleted,
        repsCompleted,
        weightUsed,
        difficulty,
      } = entry;

      return (
        !exerciseName ||
        setsCompleted === undefined ||
        repsCompleted === undefined ||
        weightUsed === undefined ||
        !difficulty
      );
    });

    if (hasInvalidEntry) {
      return res.status(400).json({
        message:
          "Each entry must include exerciseName, setsCompleted, repsCompleted, weightUsed, and difficulty.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const sessionCalories = calculateSessionCalories(entries, user.weight, duration);
    const caloriesPerEntry = Number((sessionCalories / entries.length).toFixed(2));

    const preparedEntries = entries.map((entry) => ({
      ...entry,
      oneRM: calculateOneRM(entry.weightUsed, entry.repsCompleted),
      suggestedNextWeight: 0,
      caloriesBurned: caloriesPerEntry,
    }));

    const workoutLog = await WorkoutLog.create({
      userId,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      duration: Number(duration) || 30,
      caloriesBurned: sessionCalories,
      entries: preparedEntries,
    });

    // Progressive overload: if exercise reps are same or higher than previous session, suggest +2.5kg.
    const previousSession = await WorkoutLog.findOne({
      userId,
      _id: { $ne: workoutLog._id },
    }).sort({ date: -1, createdAt: -1 });

    if (previousSession) {
      workoutLog.entries = workoutLog.entries.map((entry) => {
        const currentExerciseKey = normalizeExerciseName(entry.exerciseName);
        const prevEntry = (previousSession.entries || []).find(
          (e) => normalizeExerciseName(e.exerciseName) === currentExerciseKey
        );

        if (prevEntry && Number(entry.repsCompleted) >= Number(prevEntry.repsCompleted)) {
          const nextWeight = Number((Number(entry.weightUsed) + 2.5).toFixed(2));
          return {
            ...entry.toObject(),
            suggestedNextWeight: nextWeight,
          };
        }

        return entry;
      });
      await workoutLog.save();
    }

    const todayStart = getStartOfDay(new Date());
    let streak = 1;

    if (user.lastWorkoutDate) {
      const lastWorkoutStart = getStartOfDay(user.lastWorkoutDate);
      const diffMs = todayStart.getTime() - lastWorkoutStart.getTime();
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffDays === 0) {
        streak = user.workoutStreak || 1;
      } else if (diffDays === 1) {
        streak = (user.workoutStreak || 0) + 1;
      } else {
        streak = 1;
      }
    }

    user.lastWorkoutDate = new Date();
    user.workoutStreak = streak;
    user.longestWorkoutStreak = Math.max(user.longestWorkoutStreak || 0, streak);
    await user.save();

    return res.status(201).json({
      message: "Workout log saved successfully.",
      workoutLog,
      streak,
      longestStreak: user.longestWorkoutStreak,
      caloriesBurned: sessionCalories,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to save workout log.", error: error.message });
  }
};

const getWorkoutHistory = async (req, res) => {
  try {
    const requesterId = req.user?.id;
    const { userId } = req.params;

    if (!requesterId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (requesterId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Forbidden. You can only access your own history." });
    }

    const [history, user] = await Promise.all([
      WorkoutLog.find({ userId }).sort({ date: -1, createdAt: -1 }),
      User.findById(userId).select("workoutStreak longestWorkoutStreak"),
    ]);

    let currentStreak = user?.workoutStreak || 0;
    if (history.length > 0) {
      const latestDate = getStartOfDay(history[0].date || history[0].createdAt);
      const todayStart = getStartOfDay(new Date());
      const diffDays = Math.floor((todayStart.getTime() - latestDate.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays > 1) {
        currentStreak = 0;
      }
    }

    return res.status(200).json({
      count: history.length,
      history,
      streak: {
        current: currentStreak,
        longest: user?.longestWorkoutStreak || 0,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch workout history.", error: error.message });
  }
};

const deleteWorkoutSession = async (req, res) => {
  try {
    const requesterId = req.user?.id;
    const { sessionId } = req.params;

    if (!requesterId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const session = await WorkoutLog.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Workout session not found." });
    }

    if (session.userId.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: "Forbidden." });
    }

    await WorkoutLog.findByIdAndDelete(sessionId);
    return res.status(200).json({ message: "Workout session deleted successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete workout session.", error: error.message });
  }
};

const exportWorkoutHistoryCsv = async (req, res) => {
  try {
    const requesterId = req.user?.id;
    const { userId } = req.params;

    if (!requesterId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (requesterId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const history = await WorkoutLog.find({ userId }).sort({ date: -1, createdAt: -1 });
    const header = "Date,Exercise,Sets,Reps,Weight,Difficulty,1RM";
    const rows = [];

    history.forEach((session) => {
      const dateLabel = new Date(session.date || session.createdAt).toISOString();
      (session.entries || []).forEach((entry) => {
        rows.push(
          [
            dateLabel,
            `"${String(entry.exerciseName || "").replace(/"/g, '""')}"`,
            entry.setsCompleted,
            entry.repsCompleted,
            entry.weightUsed,
            entry.difficulty,
            entry.oneRM || 0,
          ].join(",")
        );
      });
    });

    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=workout-history.csv");
    return res.status(200).send(csv);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to export workout history.", error: error.message });
  }
};

const getCaloriesStats = async (req, res) => {
  try {
    const requesterId = req.user?.id;
    if (!requesterId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const [overall, thisWeek] = await Promise.all([
      WorkoutLog.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: null,
            totalCaloriesBurned: { $sum: { $ifNull: ["$caloriesBurned", 0] } },
            sessionCount: { $sum: 1 },
          },
        },
      ]),
      WorkoutLog.aggregate([
        {
          $match: {
            userId: req.user._id,
            date: { $gte: startOfWeek, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            caloriesThisWeek: { $sum: { $ifNull: ["$caloriesBurned", 0] } },
          },
        },
      ]),
    ]);

    const totalCaloriesBurned = Number((overall[0]?.totalCaloriesBurned || 0).toFixed(2));
    const sessionCount = overall[0]?.sessionCount || 0;
    const avgCaloriesPerSession =
      sessionCount > 0 ? Number((totalCaloriesBurned / sessionCount).toFixed(2)) : 0;
    const caloriesThisWeek = Number((thisWeek[0]?.caloriesThisWeek || 0).toFixed(2));

    return res.status(200).json({
      totalCaloriesBurned,
      avgCaloriesPerSession,
      caloriesThisWeek,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch calorie stats.", error: error.message });
  }
};

module.exports = {
  logWorkout,
  getWorkoutHistory,
  deleteWorkoutSession,
  exportWorkoutHistoryCsv,
  getCaloriesStats,
};
