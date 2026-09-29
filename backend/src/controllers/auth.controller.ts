import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/environment.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { logPlatformActivity } from "../models/AdminActivity.js";

const registration = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  targetRole: z.string().optional(),
  skills: z.array(z.string()).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});
const credentials = registration.pick({ email: true, password: true });

const issueToken = (userId: string, role = "USER") =>
  jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: "7d" });

const userResponse = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || "USER",
  status: user.status || "active",
  targetRole: user.targetRole,
  skills: user.skills,
});

export const register = async (req: Request, res: Response) => {
  const parsed = registration.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please provide a valid name, email, and 8+ character password." });
  }

  const existing = await User.findOne({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (existing) {
    return res.status(409).json({ message: "An account already exists for this email." });
  }

  const userCount = await User.count();
  const isAdminEmail =
    parsed.data.email.toLowerCase().includes("admin") ||
    parsed.data.email.toLowerCase() === "aniketradadiya1312@gmail.com";
  const role = parsed.data.role || (userCount === 0 || isAdminEmail ? "ADMIN" : "USER");

  const password = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase().trim(),
    password,
    role,
    status: "active",
    targetRole: parsed.data.targetRole ?? "Software Developer",
    skills: parsed.data.skills ?? [],
  });

  await logPlatformActivity({
    userId: user.id,
    userName: user.name,
    action: "User registered",
    module: "auth",
    details: `Registered with email: ${user.email} (${user.role})`,
  });

  return res.status(201).json({ token: issueToken(user.id, user.role), user: userResponse(user) });
};

export const login = async (req: Request, res: Response) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Valid email and password are required." });
  }

  const user = await User.findOne({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (user.status === "disabled") {
    return res.status(403).json({ message: "Your account has been disabled. Please contact the administrator." });
  }

  // Ensure default admin user email gets ADMIN role
  if (user.email === "aniketradadiya1312@gmail.com" && user.role !== "ADMIN") {
    user.role = "ADMIN";
    await user.save();
  }

  await logPlatformActivity({
    userId: user.id,
    userName: user.name,
    action: "User logged in",
    module: "auth",
    details: `${user.name} logged into ${user.role} role`,
  });

  return res.json({ token: issueToken(user.id, user.role), user: userResponse(user) });
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await User.findByPk(req.userId, { attributes: { exclude: ["password"] } });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { name, targetRole, skills, experienceLevel, studyTime } = req.body;
  if (name !== undefined) user.name = name;
  if (targetRole !== undefined) user.targetRole = targetRole;
  if (skills !== undefined && Array.isArray(skills)) user.skills = skills;
  if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
  if (studyTime !== undefined) user.studyTime = Number(studyTime);

  await user.save();
  return res.json({
    message: "Profile updated successfully",
    user: userResponse(user),
  });
};

