import { Sequelize } from "sequelize";
import { env } from "./environment.js";

export const database = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: false,
});

export const connectDatabase = async () => {
  try {
    await database.authenticate();
    await import("../models/index.js");
    await database.sync({ alter: true });
    console.log("PostgreSQL connected & synchronized with all Career Orbit models");

    try {
      const { User } = await import("../models/User.js");
      await User.update({ role: "ADMIN" }, { where: { email: "aniketradadiya1312@gmail.com" } });
    } catch {
      // Ignore if table initialising
    }
  } catch (error) {
    console.error("PostgreSQL connection failed.", error instanceof Error ? error.message : error);
    throw error;
  }
};
