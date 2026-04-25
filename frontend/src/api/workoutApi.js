import api from "./axios";

export const logWorkoutRequest = (payload) => api.post("/workout/log", payload);
export const getWorkoutHistoryRequest = (userId) => api.get(`/workout/history/${userId}`);
export const deleteWorkoutSessionRequest = (sessionId) => api.delete(`/workout/session/${sessionId}`);
export const exportWorkoutHistoryCsvRequest = (userId) =>
  api.get(`/workout/history/export/${userId}`, { responseType: "blob" });
export const getCaloriesStatsRequest = () => api.get("/workout/calories/stats");
