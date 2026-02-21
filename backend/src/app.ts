import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import runtimeRoutes from "./routes/runtimeRoutes";
import passport from "passport";
import { initPassport } from "./passport";
import authRoutes from "./routes/authRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import requestRoutes from "./routes/requestRoutes";
import guestRoutes from "./routes/guestRoutes";
import runRoutes from "./routes/runRoutes";
import { attachUser } from "./middleware/attachUser";
import {
  csrfAndOriginProtection,
  ensureCsrfCookie,
  getTrustedOrigins,
} from "./middleware/security";
import buildInfo from "./build-info.json";
import type { RepositoryRegistry } from "./data/repositories/interfaces";

export const createApp = (repositories?: RepositoryRegistry): Application => {
  const corsOrigins = getTrustedOrigins();
  const app: Application = express();
  if (repositories) {
    (app.locals as any).repositories = repositories;
  }

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
      exposedHeaders: ["x-guest-limit", "x-guest-remaining"],
    })
  );
  app.use(csrfAndOriginProtection);
  app.use(attachUser);

  app.get("/api/__health", (_req, res) => {
    res.status(200).send("ok");
  });
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      version: buildInfo.version,
      buildTime: buildInfo.buildTime,
    });
  });

  if (process.env.HTTP_REQUEST_LOGS !== "false") {
    app.use(morgan("dev"));
  }
  app.use(passport.initialize());
  initPassport();

  app.use("/api/auth", authRoutes);
  app.use("/api/runtime", runtimeRoutes);
  app.use("/api/collections", collectionRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/runs", runRoutes);
  app.use("/api/guest", guestRoutes);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use("/api", (_req, res) => {
    return res.status(404).json({ message: "Route not found" });
  });
  app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

  return app;
};
