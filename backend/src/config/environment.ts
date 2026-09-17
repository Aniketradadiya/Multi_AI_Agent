import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/ai_career_coach",
  jwtSecret: process.env.JWT_SECRET?.trim() || "development-only-secret-change-me-please-replace-in-production",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  githubToken: process.env.GITHUB_TOKEN?.trim() ?? "",
};
