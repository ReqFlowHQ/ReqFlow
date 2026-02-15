// FILE: backend/src/index.ts
import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import runtimeRoutes from "./routes/runtimeRoutes";
import connectDB from "./config/db";
import passport from "passport";
import { initPassport } from "./passport";
import authRoutes from "./routes/authRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import requestRoutes from "./routes/requestRoutes";
import guestRoutes from "./routes/guestRoutes";
import { attachUser } from "./middleware/attachUser";
import { csrfAndOriginProtection, ensureCsrfCookie, getTrustedOrigins } from "./middleware/security";

dotenv.config({ path: __dirname + "/../.env" });

const corsOrigins = getTrustedOrigins();

const app: Application = express();

// --- Middleware ---
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(ensureCsrfCookie);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: [
      "x-guest-limit",
      "x-guest-remaining",
    ],
  })
);
app.use(csrfAndOriginProtection);
app.use(attachUser);

// --- Health check (for Cloudflare Worker) ---
app.get("/api/__health", (req, res) => {
  res.status(200).send("ok");
});

app.use(morgan("dev"));
app.use(passport.initialize());
initPassport();
// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/runtime", runtimeRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`✅ ReqFlow backend running on http://localhost:${PORT}`)
  );
});
