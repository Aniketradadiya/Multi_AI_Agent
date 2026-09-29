import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class JobActivity extends Model<InferAttributes<JobActivity>, InferCreationAttributes<JobActivity>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare jobId: string;
  declare role: CreationOptional<string>;
  declare company: CreationOptional<string>;
  declare location: CreationOptional<string>;
  declare matchScore: CreationOptional<number>;
  declare isSaved: CreationOptional<boolean>;
  declare details: CreationOptional<any>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

JobActivity.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false, field: "user_id" },
    jobId: { type: DataTypes.STRING, allowNull: false, field: "job_id" },
    role: { type: DataTypes.STRING, allowNull: true },
    company: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    matchScore: { type: DataTypes.INTEGER, allowNull: true, field: "match_score" },
    isSaved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_saved" },
    details: { type: DataTypes.JSONB, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  { sequelize: database, tableName: "job_activities", underscored: true }
);
