import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class AdminActivity extends Model<InferAttributes<AdminActivity>, InferCreationAttributes<AdminActivity>> {
  declare id: CreationOptional<string>;
  declare userId: CreationOptional<string | null>;
  declare userName: string;
  declare userEmail: CreationOptional<string | null>;
  declare action: string;
  declare module: string;
  declare result: CreationOptional<string | null>;
  declare score: CreationOptional<number | null>;
  declare status: CreationOptional<string | null>;
  declare details: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare user?: any;
}

AdminActivity.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: true, field: "user_id" },
    userName: { type: DataTypes.STRING, allowNull: false, defaultValue: "Platform User", field: "user_name" },
    userEmail: { type: DataTypes.STRING, allowNull: true, field: "user_email" },
    action: { type: DataTypes.STRING, allowNull: false },
    module: { type: DataTypes.STRING, allowNull: false, defaultValue: "general" },
    result: { type: DataTypes.STRING, allowNull: true },
    score: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true, defaultValue: "Completed" },
    details: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize: database,
    tableName: "admin_activities",
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["created_at"] },
      { fields: ["module"] },
    ],
  }
);

export async function logPlatformActivity(params: {
  userId?: string | null;
  userName?: string;
  userEmail?: string | null;
  action: string;
  module: string;
  result?: string | null;
  score?: number | null;
  status?: string | null;
  details?: string | null;
}) {
  try {
    let name = params.userName;
    let email = params.userEmail;

    if (params.userId && (!name || name === "Candidate" || name === "User" || !email)) {
      try {
        const { User } = await import("./User.js");
        const u = await User.findByPk(params.userId, { attributes: ["name", "email"] });
        if (u) {
          if (!name || name === "Candidate" || name === "User") name = u.name;
          if (!email) email = u.email;
        }
      } catch {
        // Fallback to params
      }
    }

    return await AdminActivity.create({
      userId: params.userId ?? null,
      userName: name || "User",
      userEmail: email ?? null,
      action: params.action,
      module: params.module,
      result: params.result ?? "Completed",
      score: typeof params.score === "number" ? params.score : null,
      status: params.status || "Completed",
      details: params.details ?? null,
    });
  } catch (err) {
    console.warn("Failed to log activity:", err);
    return null;
  }
}

