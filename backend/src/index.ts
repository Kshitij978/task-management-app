import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

// import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import errorHandler from "./middleware/errorHandler";
import usersRoutes from "./routes/users.routes";
import tasksRoutes from "./routes/tasks.routes";
import { loadOpenApiSpec } from "./utils/swagger";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

const openapiSpec = loadOpenApiSpec();
// serve swagger UI at /api/docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
// also serve raw JSON at /api/docs.json
app.get("/api/docs.json", (_req, res) => res.json(openapiSpec));

// Rate Limiter (100 requests per 15 minutes per IP)
// You can conditionally enable this only in production
// if (process.env.NODE_ENV === "production") {
//   const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     standardHeaders: true,
//     legacyHeaders: false,
//   });
//   app.use(limiter);
// }

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Task Management API running" });
});

// Routes
app.use("/api/users", usersRoutes);
app.use("/api/tasks", tasksRoutes);

// Error Handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
