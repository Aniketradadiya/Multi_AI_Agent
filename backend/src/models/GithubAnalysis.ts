import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class GithubAnalysisModel extends Model<InferAttributes<GithubAnalysisModel>, InferCreationAttributes<GithubAnalysisModel>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare username: string;
  declare overallScore: number;
  declare portfolioScore: CreationOptional<any>;
  declare skills: CreationOptional<any>;
  declare recommendations: CreationOptional<string[]>;
  declare checklist: CreationOptional<any>;
  declare repositories: CreationOptional<any>;
  declare profile: CreationOptional<any>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

GithubAnalysisModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false, field: "user_id" },
    username: { type: DataTypes.STRING, allowNull: false },
    overallScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 75, field: "overall_score" },
    portfolioScore: { type: DataTypes.JSONB, allowNull: true, field: "portfolio_score" },
    skills: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    recommendations: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    checklist: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    repositories: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    profile: { type: DataTypes.JSONB, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  { sequelize: database, tableName: "github_analyses", underscored: true }
);
