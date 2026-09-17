import express from "express";
import cors from "cors";
import { env } from "./config/environment.js";
import { connectDatabase } from "./config/database.js";
import { authRouter } from "./routes/auth.routes.js";
import { careerRouter } from "./routes/career.routes.js";

const app = express();
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api", careerRouter);
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error); res.status(500).json({ message: "Unexpected server error" }); });

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
  } catch {
    process.exitCode = 1;
  }
};

void startServer();
// GitHub Analyzer integrated
