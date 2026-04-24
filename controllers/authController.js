const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured in environment variables.");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      goal = "",
      level = "",
      daysPerWeek = 0,
      weight = 0,
      height = 0,
    } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const user = await User.create({
      name,
      email,
      password,
      goal,
      level,
      daysPerWeek,
      weight,
      height,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        level: user.level,
        daysPerWeek: user.daysPerWeek,
        weight: user.weight,
        height: user.height,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        level: user.level,
        daysPerWeek: user.daysPerWeek,
        weight: user.weight,
        height: user.height,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

module.exports = {
  registerUser,
  register: registerUser,
  login,
};
