const User = require("../models/User");
const WorkoutPlan = require("../models/WorkoutPlan");

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

const buildExerciseTargets = (
  exerciseNames,
  { targetWeight = 20, targetSets = 3, targetReps = 12 } = {}
) => {
  return exerciseNames.map((name) => ({
    name,
    targetWeight,
    targetSets,
    targetReps,
  }));
};

const buildBeginnerPlan = (daysPerWeek) => {
  const days = WEEK_DAYS.slice(0, daysPerWeek);
  return days.map((day) => ({
    day,
    focus: "Full Body",
    exercises: buildExerciseTargets(FULL_BODY_EXERCISES, {
      targetWeight: 15,
      targetSets: 3,
      targetReps: 12,
    }),
  }));
};

const buildIntermediatePlan = (daysPerWeek) => {
  const cycle = [
    { focus: "Push", exercises: PUSH_EXERCISES },
    { focus: "Pull", exercises: PULL_EXERCISES },
    { focus: "Legs", exercises: LEGS_EXERCISES },
  ];

  const plan = [];
  for (let i = 0; i < daysPerWeek; i += 1) {
    const split = cycle[i % cycle.length];
    plan.push({
      day: WEEK_DAYS[i],
      focus: split.focus,
      exercises: buildExerciseTargets(split.exercises, {
        targetWeight: 25,
        targetSets: 4,
        targetReps: 10,
      }),
    });
  }

  return plan;
};

const generatePlan = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const level = (user.level || "").toLowerCase();
    const daysPerWeek = Number(user.daysPerWeek) || 3;

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      return res
        .status(400)
        .json({ message: "daysPerWeek must be between 1 and 7." });
    }

    let splitType = "Full Body";
    let generatedPlan = buildBeginnerPlan(daysPerWeek);

    if (level === "intermediate") {
      splitType = "Push/Pull/Legs";
      generatedPlan = buildIntermediatePlan(daysPerWeek);
    }

    const workoutPlan = await WorkoutPlan.create({
      user: user._id,
      level: user.level || "beginner",
      daysPerWeek,
      splitType,
      plan: generatedPlan,
    });

    return res.status(201).json({
      message: "Workout plan generated successfully.",
      workoutPlan,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to generate workout plan.", error: error.message });
  }
};

module.exports = { generatePlan };
