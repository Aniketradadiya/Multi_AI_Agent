import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class AdminActivity extends Model<InferAttributes<AdminActivity>, InferCreationAttributes<AdminActivity>> {
  declare id: CreationOptional<string>;
  declare userId: CreationOptional<string | null>;
  declare userName: string;
  declare action: string;
  declare module: string;
  declare details: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AdminActivity.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: true, field: "user_id" },
    userName: { type: DataTypes.STRING, allowNull: false, defaultValue: "Platform User", field: "user_name" },
    action: { type: DataTypes.STRING, allowNull: false },
    module: { type: DataTypes.STRING, allowNull: false, defaultValue: "general" },
    details: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  { sequelize: database, tableName: "admin_activities", underscored: true }
);

export async function logPlatformActivity(params: {
  userId?: string | null;
  userName?: string;
  action: string;
  module: string;
  details?: string | null;
}) {
  try {
    return await AdminActivity.create({
      userId: params.userId ?? null,
      userName: params.userName || "User",
      action: params.action,
      module: params.module,
      details: params.details ?? null,
    });
  } catch (err) {
    console.warn("Failed to log activity:", err);
    return null;
  }
}
