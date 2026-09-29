import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { database } from "../config/database.js";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: CreationOptional<"USER" | "ADMIN">;
  declare status: CreationOptional<"active" | "disabled">;
  declare targetRole: CreationOptional<string>;
  declare experienceLevel: CreationOptional<string>;
  declare skills: CreationOptional<string[]>;
  declare studyTime: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: "USER" },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "active" },
  targetRole: { type: DataTypes.STRING, allowNull: false, defaultValue: "Software Developer", field: "target_role" },
  experienceLevel: { type: DataTypes.STRING, allowNull: false, defaultValue: "Student", field: "experience_level" },
  skills: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
  studyTime: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2, field: "study_time" },
  createdAt: { type: DataTypes.DATE, field: "created_at" },
  updatedAt: { type: DataTypes.DATE, field: "updated_at" },
}, { sequelize: database, tableName: "users", underscored: true });
