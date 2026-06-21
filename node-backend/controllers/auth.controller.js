import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import StudentRegistry from "../models/studentRegistry.model.js";

export const signup = async (req, res) => {
  try {
    const { email, rollNumber, password } = req.body;

    if (!email || !rollNumber || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Check registry
    const student = await StudentRegistry.findOne({
      email: normalizedEmail,
      rollNumber,
    });
    if (!student) {
      return res.status(403).json({
        error: "Not authorized to register",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { rollNumber }],
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: student.fullName, // pull from registry
      email,
      rollNumber,
      password: hashedPassword,
      role: "student",
      isVerified: true,
    });

    await user.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        error: "Invalid email or password",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({
        error: "Invalid email or password",
      });

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Signin successful", role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// controllers/auth.controller.js
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
