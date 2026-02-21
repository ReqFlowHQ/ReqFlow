import { NextFunction, Request, Response } from "express";
import {
  interpolateTemplateString,
  toInterpolationVariables,
} from "../utils/templateInterpolation";

const isHttpUrl = (value: unknown): boolean =>
  typeof value === "string" && /^https?:\/\//i.test(value);

const resolveUrlForValidation = (
  rawUrl: unknown,
  rawEnvironmentVariables: unknown
): string => {
  if (typeof rawUrl !== "string") return "";
  const interpolationVariables = toInterpolationVariables(rawEnvironmentVariables);
  return interpolateTemplateString(rawUrl, interpolationVariables).trim();
};

export const validateProxyExecutionPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { url } = req.body || {};
  const resolvedUrl = resolveUrlForValidation(url, req.body?.environmentVariables);
  if (!isHttpUrl(resolvedUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  return next();
};

export const validateRuntimeExecutionPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const runtimeRequest = req.body?.request;
  const resolvedUrl = resolveUrlForValidation(
    runtimeRequest?.url,
    req.body?.environmentVariables
  );
  if (!runtimeRequest?.method || !isHttpUrl(resolvedUrl)) {
    return res.status(400).json({ error: "Invalid request payload" });
  }
  return next();
};
