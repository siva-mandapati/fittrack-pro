const jwt = require("jsonwebtoken");
const User = require("../models/User");

const extractToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  if (authToken) {
    return authToken;
  }

  const headerToken = socket.handshake?.headers?.authorization;
  if (headerToken && headerToken.startsWith("Bearer ")) {
    return headerToken.split(" ")[1];
  }

  return null;
};

const socketAuth = async (socket, next) => {
  try {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Authentication failed. Token missing."));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_key");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication failed. User not found."));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error("Authentication failed. Invalid token."));
  }
};

module.exports = { socketAuth };
