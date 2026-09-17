import { Sequelize } from "sequelize";
import { env } from "./environment.js";

export const database = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: false,
});

export const connectDatabase = async () => {
  try {
    await database.authenticate();
    await database.sync();
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("PostgreSQL connection failed.", error instanceof Error ? error.message : error);
    throw error;
  }
};
