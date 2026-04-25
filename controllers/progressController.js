const WorkoutLog = require("../models/WorkoutLog");
const WorkoutPlan = require("../models/WorkoutPlan");
const User = require("../models/User");

const DAYS_14_MS = 14 * 24 * 60 * 60 * 1000;
const WEIGHT_STEP_KG = 2.5;
const DEFAULT_TARGET_WEIGHT = 20;
const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = 12;
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FULL_BODY_EXERCISES = [
  "Squat",
  "Push-Up",
  "Bent-Over Row",
  "Plank",
  "Dumbbell Shoulder Press",
  "Glute Bridge",
];
const PUSH_EXERCISES = [
  "Bench Press",
  "Incline Dumbbell Press",
  "Overhead Press",
  "Triceps Dips",
  "Lateral Raises",
];
const PULL_EXERCISES = [
  "Deadlift",
  "Lat Pulldown",
  "Seated Cable Row",
  "Face Pull",
  "Biceps Curl",
];
const LEGS_EXERCISES = [
  "Back Squat",
  "Romanian Deadlift",
  "Walking Lunges",
  "Leg Press",
  "Calf Raises",
];

const MUSCLE_GROUP_RULES = [
  { group: "Chest", patterns: ["bench", "chest", "push-up", "dip", "press"] },
  { group: "Back", patterns: ["row", "pull", "deadlift", "lat"] },
  { group: "Legs", patterns: ["squat", "lunge", "leg", "calf", "glute", "hamstring"] },
  { group: "Shoulders", patterns: ["shoulder", "overhead", "lateral"] },
  { group: "Arms", patterns: ["bicep", "tricep", "curl", "extension"] },
];

const normalizeExerciseName = (exerciseName) => {
  return String(exerciseName || "")
    .split("|")[0]
    .trim()
    .toLowerCase();
};

const getMuscleGroup = (exerciseName) => {
  const name = normalizeExerciseName(exerciseName);
  const match = MUSCLE_GROUP_RULES.find((rule) =>
    rule.patterns.some((pattern) => name.includes(pattern))
  );
  return match ? match.group : "Arms";
};

const buildLatestDifficultyMap = (logs) => {
  const latestByExercise = new Map();

  logs.forEach((log) => {
    log.entries.forEach((entry) => {
      const key = normalizeExerciseName(entry.exerciseName);
      const existing = latestByExercise.get(key);

      if (!existing || log.createdAt > existing.createdAt) {
        latestByExercise.set(key, {
          createdAt: log.createdAt,
          difficulty: String(entry.difficulty || "").toLowerCase(),
          exerciseName: entry.exerciseName,
        });
      }
    });
  });

  return latestByExercise;
};

const calculateAverageWeight = (logs) => {
  let total = 0;
  let count = 0;

  logs.forEach((log) => {
    log.entries.forEach((entry) => {
      total += Number(entry.weightUsed) || 0;
      count += 1;
    });
  });

  return count > 0 ? total / count : 0;
};

const calculateEntryVolume = (entry) => {
  const sets = Number(entry.setsCompleted) || 0;
  const reps = Number(entry.repsCompleted) || 0;
  const weight = Number(entry.weightUsed) || 0;
  return sets * reps * weight;
};

const detectTrendFromVolumes = (volumes) => {
  if (volumes.length < 3) {
    return "plateau";
  }

  const [v1, v2, v3] = volumes.slice(-3);
  if (v1 < v2 && v2 < v3) {
    return "improving";
  }
  if (v1 > v2 && v2 > v3) {
    return "declining";
  }
  return "plateau";
};

const buildRecommendation = (trend) => {
  if (trend === "improving") {
    return "Progress is strong. Continue progressive overload gradually.";
  }
  if (trend === "declining") {
    return "Reduce intensity briefly and focus on recovery, sleep, and form.";
  }
  return "Progress has plateaued. Adjust volume or exercise variation.";
};

const generateSmartRecommendations = (exerciseAnalytics) => {
  const recommendations = [];
  let shouldAddRestDay = false;

  exerciseAnalytics.forEach((item) => {
    if (item.trend === "improving") {
      recommendations.push({
        exercise: item.exercise,
        action: "increase_weight",
        value: "+2.5kg",
      });
      return;
    }

    if (item.trend === "plateau") {
      recommendations.push({
        exercise: item.exercise,
        action: "increase_reps",
        value: "+2",
      });
      return;
    }

    if (item.trend === "declining") {
      recommendations.push({
        exercise: item.exercise,
        action: "reduce_weight",
        value: "-5%",
      });
      shouldAddRestDay = true;
    }
  });

  if (shouldAddRestDay) {
    recommendations.push({
      exercise: "overall_program",
      action: "add_rest_day",
      value: "1 additional rest day",
    });
  }

  return recommendations;
};

const buildExerciseAnalytics = (logs) => {
  const byExercise = new Map();

  logs
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((log) => {
      log.entries.forEach((entry) => {
        const key = normalizeExerciseName(entry.exerciseName);
        const volume = calculateEntryVolume(entry);
        const weight = Number(entry.weightUsed) || 0;
        const sets = Number(entry.setsCompleted) || 0;

        if (!byExercise.has(key)) {
          byExercise.set(key, {
            exercise: entry.exerciseName,
            totalVolume: 0,
            totalWeight: 0,
            weightSamples: 0,
            totalSets: 0,
            volumesByWorkout: [],
          });
        }

        const aggregate = byExercise.get(key);
        aggregate.totalVolume += volume;
        aggregate.totalWeight += weight;
        aggregate.weightSamples += 1;
        aggregate.totalSets += sets;
        aggregate.volumesByWorkout.push(volume);
      });
    });

  return Array.from(byExercise.values()).map((item) => {
    const trend = detectTrendFromVolumes(item.volumesByWorkout);
    const avgVolume =
      item.volumesByWorkout.length > 0
        ? item.totalVolume / item.volumesByWorkout.length
        : 0;

    return {
      exercise: item.exercise,
      trend,
      avgVolume: Number(avgVolume.toFixed(2)),
      recommendation: buildRecommendation(trend),
      totalVolume: Number(item.totalVolume.toFixed(2)),
      averageWeight:
        item.weightSamples > 0
          ? Number((item.totalWeight / item.weightSamples).toFixed(2))
          : 0,
      totalSets: item.totalSets,
    };
  });
};

const normalizePlanExercise = (exercise) => {
  if (typeof exercise === "string") {
    return {
      name: exercise,
      targetWeight: DEFAULT_TARGET_WEIGHT,
      targetSets: DEFAULT_TARGET_SETS,
      targetReps: DEFAULT_TARGET_REPS,
    };
  }

  return {
    name: exercise.name,
    targetWeight:
      typeof exercise.targetWeight === "number"
        ? exercise.targetWeight
        : DEFAULT_TARGET_WEIGHT,
    targetSets:
      typeof exercise.targetSets === "number" ? exercise.targetSets : DEFAULT_TARGET_SETS,
    targetReps:
      typeof exercise.targetReps === "number" ? exercise.targetReps : DEFAULT_TARGET_REPS,
  };
};

const buildExerciseTargets = (
  exerciseNames,
  { targetWeight = DEFAULT_TARGET_WEIGHT, targetSets = DEFAULT_TARGET_SETS, targetReps = DEFAULT_TARGET_REPS } = {}
) => {
  return exerciseNames.map((name) => ({ name, targetWeight, targetSets, targetReps }));
};

const buildPlanByLevel = (level, daysPerWeek) => {
  const normalizedLevel = String(level || "").toLowerCase();
  const safeDays = Math.min(Math.max(Number(daysPerWeek) || 3, 1), 7);

  if (normalizedLevel === "intermediate") {
    const cycle = [
      { focus: "Push", exercises: PUSH_EXERCISES },
      { focus: "Pull", exercises: PULL_EXERCISES },
      { focus: "Legs", exercises: LEGS_EXERCISES },
    ];

    return {
      splitType: "Push/Pull/Legs",
      plan: Array.from({ length: safeDays }).map((_, index) => {
        const split = cycle[index % cycle.length];
        return {
          day: WEEK_DAYS[index],
          focus: split.focus,
          exercises: buildExerciseTargets(split.exercises, {
            targetWeight: 25,
            targetSets: 4,
            targetReps: 10,
          }),
        };
      }),
    };
  }

  return {
    splitType: "Full Body",
    plan: WEEK_DAYS.slice(0, safeDays).map((day) => ({
      day,
      focus: "Full Body",
      exercises: buildExerciseTargets(FULL_BODY_EXERCISES, {
        targetWeight: 15,
        targetSets: 3,
        targetReps: 12,
      }),
    })),
  };
};

const safeParseGeminiJson = (text) => {
  if (!text) return null;
  let cleaned = String(text).trim();
  cleaned = cleaned.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      const normalized = cleaned
        .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*?)'/g, ': "$1"');
      return JSON.parse(normalized);
    } catch {
      return null;
    }
  }
};

const buildRecentWorkoutSummary = (sessions) => {
  return sessions.slice(0, 5).map((session) => ({
    date: session.date || session.createdAt,
    exercises: (session.entries || []).map((entry) => ({
      exerciseName: entry.exerciseName,
      repsCompleted: entry.repsCompleted,
      setsCompleted: entry.setsCompleted,
      weightUsed: entry.weightUsed,
    })),
  }));
};

const analyzeProgress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const now = new Date();
    const recentStart = new Date(now.getTime() - DAYS_14_MS);
    const previousStart = new Date(now.getTime() - DAYS_14_MS * 2);
    const byUserAndDateRange = (start, end, includeEnd = false) => {
      const dateRange = includeEnd
        ? { $gte: start, $lte: end }
        : { $gte: start, $lt: end };

      return {
        userId,
        $or: [
          { date: dateRange },
          // Backward compatibility for older workout logs before session refactor.
          { date: { $exists: false }, createdAt: dateRange },
        ],
      };
    };

    const [existingPlan, recentLogs, previousLogs, userProfile, totalVolumeAgg, totalCaloriesAgg, mostTrained] =
      await Promise.all([
      WorkoutPlan.findOne({ user: userId }).sort({ createdAt: -1 }),
      WorkoutLog.find(byUserAndDateRange(recentStart, now, true)).sort({
        date: -1,
        createdAt: -1,
      }),
      WorkoutLog.find(byUserAndDateRange(previousStart, recentStart)).sort({
        date: -1,
        createdAt: -1,
      }),
      User.findById(userId).select("level daysPerWeek workoutStreak"),
      WorkoutLog.aggregate([
        { $match: { userId: req.user._id } },
        { $unwind: "$entries" },
        {
          $group: {
            _id: null,
            totalVolume: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$entries.setsCompleted", 0] },
                  { $ifNull: ["$entries.repsCompleted", 0] },
                  { $ifNull: ["$entries.weightUsed", 0] },
                ],
              },
            },
          },
        },
      ]),
      WorkoutLog.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: null,
            totalCalories: { $sum: { $ifNull: ["$caloriesBurned", 0] } },
          },
        },
      ]),
      WorkoutLog.aggregate([
        { $match: { userId: req.user._id } },
        { $unwind: "$entries" },
        {
          $group: {
            _id: "$entries.exerciseName",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    let latestPlan = existingPlan;
    let createdBaselinePlan = false;

    if (!latestPlan) {
      const generated = buildPlanByLevel(req.user?.level, req.user?.daysPerWeek);
      latestPlan = await WorkoutPlan.create({
        user: userId,
        level: req.user?.level || "beginner",
        daysPerWeek: Math.min(Math.max(Number(req.user?.daysPerWeek) || 3, 1), 7),
        splitType: generated.splitType,
        plan: generated.plan,
      });
      createdBaselinePlan = true;
    }

    if (!recentLogs.length) {
      return res.status(400).json({ message: "No recent workout logs to analyze." });
    }

    const latestDifficultyByExercise = buildLatestDifficultyMap(recentLogs);
    const recentAverageWeight = calculateAverageWeight(recentLogs);
    const previousAverageWeight = calculateAverageWeight(previousLogs);

    const noProgressForTwoWeeks =
      previousLogs.length > 0 && recentAverageWeight <= previousAverageWeight;

    latestPlan.plan = latestPlan.plan.map((day) => {
      const updatedExercises = day.exercises.map((exercise) => {
        const normalizedExercise = normalizePlanExercise(exercise);
        const key = normalizeExerciseName(normalizedExercise.name);
        const latest = latestDifficultyByExercise.get(key);
        const difficulty = latest?.difficulty || "normal";

        let nextWeight = normalizedExercise.targetWeight;
        if (difficulty === "easy") {
          nextWeight += WEIGHT_STEP_KG;
        } else if (difficulty === "hard") {
          nextWeight = Math.max(0, nextWeight - WEIGHT_STEP_KG);
        }

        let nextSets = normalizedExercise.targetSets;
        let nextReps = normalizedExercise.targetReps;

        if (noProgressForTwoWeeks) {
          nextSets = 4;
          nextReps = 10;
        }

        return {
          name: normalizedExercise.name,
          targetWeight: Number(nextWeight.toFixed(2)),
          targetSets: nextSets,
          targetReps: nextReps,
        };
      });

      return {
        day: day.day,
        focus: day.focus,
        exercises: updatedExercises,
      };
    });

    await latestPlan.save();
    const exerciseAnalytics = buildExerciseAnalytics(recentLogs);
    const recommendations = generateSmartRecommendations(exerciseAnalytics);

    return res.status(200).json({
      message: "Progress analyzed and workout plan updated.",
      analysis: {
        createdBaselinePlan,
        recentLogsCount: recentLogs.length,
        previousLogsCount: previousLogs.length,
        recentAverageWeight: Number(recentAverageWeight.toFixed(2)),
        previousAverageWeight: Number(previousAverageWeight.toFixed(2)),
        noProgressForTwoWeeks,
      },
      exerciseAnalytics,
      recommendations,
      updatedPlan: latestPlan,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to analyze progress.", error: error.message });
  }
};

const getProgressDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const [overallStats] = await WorkoutLog.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: "$entries" },
      {
        $addFields: {
          entryVolume: {
            $multiply: [
              { $ifNull: ["$entries.setsCompleted", 0] },
              { $ifNull: ["$entries.repsCompleted", 0] },
              { $ifNull: ["$entries.weightUsed", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalVolumeLifted: { $sum: "$entryVolume" },
        },
      },
    ]);

    const [bestSession] = await WorkoutLog.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: "$entries" },
      {
        $addFields: {
          entryVolume: {
            $multiply: [
              { $ifNull: ["$entries.setsCompleted", 0] },
              { $ifNull: ["$entries.repsCompleted", 0] },
              { $ifNull: ["$entries.weightUsed", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          date: { $first: "$date" },
          totalVolume: { $sum: "$entryVolume" },
        },
      },
      { $sort: { totalVolume: -1 } },
      { $limit: 1 },
    ]);

    const frequentExercise = await WorkoutLog.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: "$entries" },
      {
        $group: {
          _id: "$entries.exerciseName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const mostTrainedExercise = frequentExercise[0]?._id || "N/A";

    return res.status(200).json({
      totalVolumeLifted: Number((overallStats?.totalVolumeLifted || 0).toFixed(2)),
      mostTrainedMuscleGroup: getMuscleGroup(mostTrainedExercise),
      mostTrainedExercise,
      bestSession: bestSession
        ? {
            id: bestSession._id,
            date: bestSession.date,
            totalVolume: Number((bestSession.totalVolume || 0).toFixed(2)),
          }
        : null,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch aggregation stats.", error: error.message });
  }
};

const getWeeklyMuscleGroupVolume = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyLogs = await WorkoutLog.find({
      userId,
      date: { $gte: startOfWeek, $lte: now },
    });

    const totals = {
      Chest: 0,
      Back: 0,
      Legs: 0,
      Shoulders: 0,
      Arms: 0,
    };

    weeklyLogs.forEach((log) => {
      (log.entries || []).forEach((entry) => {
        const group = getMuscleGroup(entry.exerciseName);
        totals[group] += Number(entry.setsCompleted) || 0;
      });
    });

    const weeklyMuscleVolume = Object.entries(totals).map(([muscleGroup, sets]) => ({
      muscleGroup,
      sets,
    }));

    return res.status(200).json({ weeklyMuscleVolume });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch weekly muscle group volume.", error: error.message });
  }
};

module.exports = { analyzeProgress, getProgressDashboardStats, getWeeklyMuscleGroupVolume };
