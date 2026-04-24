const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized. Token missing." });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server auth configuration error." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized. User not found." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Not authorized. Token expired." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Not authorized. Invalid token." });
    }

    return res.status(401).json({ message: "Not authorized. Token verification failed." });
  }
};

module.exports = { protect };
