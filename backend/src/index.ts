// FILE: backend/src/index.ts
import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import connectDB from "./config/db";
import "./passport";

import authRoutes from "./routes/authRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import requestRoutes from "./routes/requestRoutes";

dotenv.config();

const app: Application = express();

// --- Middleware ---
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(passport.initialize());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors({ origin: true, credentials: true }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`✅ ReqFlow backend running on http://localhost:${PORT}`)
  );
});
