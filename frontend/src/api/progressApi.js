import api from "./axios";

export const analyzeProgressRequest = () => api.post("/progress/analyze", {});
export const getProgressDashboardStatsRequest = () => api.get("/progress/dashboard-stats");
export const getWeeklyMuscleVolumeRequest = () => api.get("/progress/weekly-muscle-volume");
