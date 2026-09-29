import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class CodingAttempt extends Model<InferAttributes<CodingAttempt>, InferCreationAttributes<CodingAttempt>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare problemTitle: string;
  declare topic: string;
  declare difficulty: string;
  declare language: string;
  declare score: number;
  declare passed: boolean;
  declare code: CreationOptional<string>;
  declare feedback: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CodingAttempt.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.STRING, allowNull: false, field: "user_id" },
    problemTitle: { type: DataTypes.STRING, allowNull: false, field: "problem_title" },
    topic: { type: DataTypes.STRING, allowNull: false },
    difficulty: { type: DataTypes.STRING, allowNull: false, defaultValue: "Easy" },
    language: { type: DataTypes.STRING, allowNull: false, defaultValue: "JavaScript" },
    score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 80 },
    passed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    code: { type: DataTypes.TEXT, allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  { sequelize: database, tableName: "coding_attempts", underscored: true }
);
