const WorkoutLog = require("../models/WorkoutLog");

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await WorkoutLog.aggregate([
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
          _id: "$userId",
          totalVolume: { $sum: "$entryVolume" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { totalVolume: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: "$user.name",
          totalVolume: { $round: ["$totalVolume", 2] },
        },
      },
    ]);

    return res.status(200).json({ leaderboard });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch leaderboard.", error: error.message });
  }
};

module.exports = { getLeaderboard };
