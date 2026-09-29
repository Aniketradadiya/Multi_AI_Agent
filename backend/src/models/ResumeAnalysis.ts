import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class ResumeAnalysis extends Model<InferAttributes<ResumeAnalysis>, InferCreationAttributes<ResumeAnalysis>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare atsScore: number;
  declare candidateName: CreationOptional<string>;
  declare fileName: string;
  declare summary: CreationOptional<string>;
  declare categoryScores: CreationOptional<any>;
  declare changesRequired: CreationOptional<any>;
  declare jobMatch: CreationOptional<any>;
  declare sectionAnalysis: CreationOptional<any>;
  declare strengths: CreationOptional<string[]>;
  declare weaknesses: CreationOptional<string[]>;
  declare missingSkills: CreationOptional<string[]>;
  declare suggestions: CreationOptional<string[]>;
  declare recommendedRoles: CreationOptional<string[]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ResumeAnalysis.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false, field: "user_id" },
    atsScore: { type: DataTypes.INTEGER, allowNull: false, field: "ats_score" },
    candidateName: { type: DataTypes.STRING, allowNull: true, field: "candidate_name" },
    fileName: { type: DataTypes.STRING, allowNull: false, field: "file_name" },
    summary: { type: DataTypes.TEXT, allowNull: true },
    categoryScores: { type: DataTypes.JSONB, allowNull: true, field: "category_scores" },
    changesRequired: { type: DataTypes.JSONB, allowNull: true, field: "changes_required" },
    jobMatch: { type: DataTypes.JSONB, allowNull: true, field: "job_match" },
    sectionAnalysis: { type: DataTypes.JSONB, allowNull: true, field: "section_analysis" },
    strengths: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    weaknesses: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    missingSkills: { type: DataTypes.JSONB, allowNull: false, defaultValue: [], field: "missing_skills" },
    suggestions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    recommendedRoles: { type: DataTypes.JSONB, allowNull: false, defaultValue: [], field: "recommended_roles" },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  { sequelize: database, tableName: "resume_analyses", underscored: true }
);
