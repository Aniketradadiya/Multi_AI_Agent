import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/environment.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const registration = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), targetRole: z.string().optional(), skills: z.array(z.string()).optional() });
const credentials = registration.pick({ email: true, password: true });
const issueToken = (userId: string) => jwt.sign({ userId }, env.jwtSecret, { expiresIn: "7d" });

const userResponse = (user: User) => ({ id: user.id, name: user.name, email: user.email, targetRole: user.targetRole, skills: user.skills });

export const register = async (req: Request, res: Response) => {
  const parsed = registration.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please provide a valid name, email, and 8+ character password." });
  const existing = await User.findOne({ where: { email: parsed.data.email } });
  if (existing) return res.status(409).json({ message: "An account already exists for this email." });
  const password = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({ name: parsed.data.name, email: parsed.data.email, password, targetRole: parsed.data.targetRole ?? "Software Developer", skills: parsed.data.skills ?? [] });
  return res.status(201).json({ token: issueToken(user.id), user: userResponse(user) });
};

export const login = async (req: Request, res: Response) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Valid email and password are required." });
  const user = await User.findOne({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) return res.status(401).json({ message: "Invalid email or password." });
  return res.json({ token: issueToken(user.id), user: userResponse(user) });
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

