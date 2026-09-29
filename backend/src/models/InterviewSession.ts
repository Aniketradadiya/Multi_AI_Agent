import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class InterviewSessionModel extends Model<InferAttributes<InterviewSessionModel>, InferCreationAttributes<InterviewSessionModel>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare role: string;
  declare interviewType: string;
  declare score: number;
  declare communicationScore: CreationOptional<number>;
  declare technicalScore: CreationOptional<number>;
  declare questionsCount: number;
  declare weakAreas: CreationOptional<string[]>;
  declare report: CreationOptional<any>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

InterviewSessionModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false, field: "user_id" },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: "Software Developer" },
    interviewType: { type: DataTypes.STRING, allowNull: false, defaultValue: "Mixed", field: "interview_type" },
    score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 75 },
    communicationScore: { type: DataTypes.INTEGER, allowNull: true, field: "communication_score" },
    technicalScore: { type: DataTypes.INTEGER, allowNull: true, field: "technical_score" },
    questionsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, field: "questions_count" },
    weakAreas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [], field: "weak_areas" },
    report: { type: DataTypes.JSONB, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  { sequelize: database, tableName: "interview_sessions", underscored: true }
);
