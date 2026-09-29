import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class Roadmap extends Model<InferAttributes<Roadmap>, InferCreationAttributes<Roadmap>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare title: CreationOptional<string>;
  declare targetRole: string;
  declare skillLevel: CreationOptional<string>;
  declare studyTime: CreationOptional<string>;
  declare goal: CreationOptional<string>;
  declare currentFocus: CreationOptional<string>;
  declare currentFocusReason: CreationOptional<string>;
  declare aiRecommendation: CreationOptional<string>;
  declare phases: any;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Roadmap.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false, field: "user_id" },
    title: { type: DataTypes.STRING, allowNull: true },
    targetRole: { type: DataTypes.STRING, allowNull: false, field: "target_role" },
    skillLevel: { type: DataTypes.STRING, allowNull: true, field: "skill_level" },
    studyTime: { type: DataTypes.STRING, allowNull: true, field: "study_time" },
    goal: { type: DataTypes.STRING, allowNull: true },
    currentFocus: { type: DataTypes.STRING, allowNull: true, field: "current_focus" },
    currentFocusReason: { type: DataTypes.TEXT, allowNull: true, field: "current_focus_reason" },
    aiRecommendation: { type: DataTypes.TEXT, allowNull: true, field: "ai_recommendation" },
    phases: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  { sequelize: database, tableName: "roadmaps", underscored: true }
);
