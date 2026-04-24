const activeSessions = new Map();

const broadcastToUserAndMonitors = (io, userId, eventName, payload) => {
  io.to(`user:${userId}`).emit(eventName, payload);
  io.to(`monitor:${userId}`).emit(eventName, payload);
};

const registerWorkoutEvents = (io, socket) => {
  const userId = socket.user.id.toString();

  socket.on("startWorkout", (payload = {}) => {
    const sessionId = payload.sessionId || `${userId}-${Date.now()}`;
    const sessionData = {
      sessionId,
      userId,
      workoutPlanId: payload.workoutPlanId || null,
      startedAt: new Date(),
      endedAt: null,
      totalSetsLogged: 0,
      status: "active",
    };

    activeSessions.set(sessionId, sessionData);
    socket.join(`workout:${sessionId}`);

    broadcastToUserAndMonitors(io, userId, "progressUpdate", {
      type: "workoutStarted",
      session: sessionData,
    });
    broadcastToUserAndMonitors(io, userId, "notification", {
      title: "Workout started",
      message: "Your workout session is now active.",
      sessionId,
    });

    socket.emit("workoutStarted", sessionData);
  });

  socket.on("logSet", (payload = {}) => {
    const { sessionId, exerciseName, setNumber, reps, weight, difficulty } = payload;

    if (!sessionId || !activeSessions.has(sessionId)) {
      return socket.emit("errorMessage", {
        event: "logSet",
        message: "Session not found. Start a workout first.",
      });
    }

    const session = activeSessions.get(sessionId);
    if (session.userId !== userId) {
      return socket.emit("errorMessage", {
        event: "logSet",
        message: "You cannot log sets for another user session.",
      });
    }

    session.totalSetsLogged += 1;
    activeSessions.set(sessionId, session);

    const setPayload = {
      sessionId,
      exerciseName,
      setNumber,
      reps,
      weight,
      difficulty,
      loggedAt: new Date(),
      totalSetsLogged: session.totalSetsLogged,
    };

    io.to(`workout:${sessionId}`).emit("setLogged", setPayload);
    broadcastToUserAndMonitors(io, userId, "progressUpdate", {
      type: "setLogged",
      ...setPayload,
    });

    if (session.totalSetsLogged % 5 === 0) {
      broadcastToUserAndMonitors(io, userId, "notification", {
        title: "Great progress",
        message: `You have logged ${session.totalSetsLogged} sets.`,
        sessionId,
      });
    }
  });

  socket.on("endWorkout", (payload = {}) => {
    const { sessionId } = payload;

    if (!sessionId || !activeSessions.has(sessionId)) {
      return socket.emit("errorMessage", {
        event: "endWorkout",
        message: "Session not found.",
      });
    }

    const session = activeSessions.get(sessionId);
    if (session.userId !== userId) {
      return socket.emit("errorMessage", {
        event: "endWorkout",
        message: "You cannot end another user session.",
      });
    }

    const endedAt = new Date();
    const durationMinutes = Math.max(
      1,
      Math.round((endedAt.getTime() - new Date(session.startedAt).getTime()) / 60000)
    );

    const completedSession = {
      ...session,
      endedAt,
      durationMinutes,
      status: "completed",
    };

    activeSessions.delete(sessionId);
    socket.leave(`workout:${sessionId}`);

    io.to(`workout:${sessionId}`).emit("workoutEnded", completedSession);
    broadcastToUserAndMonitors(io, userId, "progressUpdate", {
      type: "workoutEnded",
      session: completedSession,
    });
    broadcastToUserAndMonitors(io, userId, "notification", {
      title: "Workout complete",
      message: `Workout ended. Duration: ${durationMinutes} minutes.`,
      sessionId,
    });
  });

  // Optional trainer monitoring: trainer joins a user monitor room.
  socket.on("monitorUser", (payload = {}) => {
    const traineeUserId = payload.traineeUserId;
    if (!traineeUserId) {
      return socket.emit("errorMessage", {
        event: "monitorUser",
        message: "traineeUserId is required.",
      });
    }

    socket.join(`monitor:${traineeUserId}`);
    return socket.emit("monitoringStarted", {
      traineeUserId,
      room: `monitor:${traineeUserId}`,
    });
  });
};

module.exports = { registerWorkoutEvents };
