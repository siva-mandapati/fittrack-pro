const { Server } = require("socket.io");
const { socketAuth } = require("./socketAuth");
const { registerWorkoutEvents } = require("../events/workoutEvents");

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user.id.toString();

    socket.join(`user:${userId}`);
    socket.emit("notification", {
      title: "Connected",
      message: "Real-time connection established.",
    });

    registerWorkoutEvents(io, socket);

    socket.on("disconnect", () => {
      // No-op: reserved for future cleanup hooks.
    });
  });

  return io;
};

module.exports = { initializeSocket };
