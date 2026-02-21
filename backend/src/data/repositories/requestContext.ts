import type { Request } from "express";
import type { RepositoryRegistry } from "./interfaces";
import { getRepositoryRegistry } from "./registry";

export const resolveRepositoryRegistry = (
  req?: Request
): RepositoryRegistry => {
  const appRegistry = req?.app?.locals?.repositories as
    | RepositoryRegistry
    | undefined;

  if (appRegistry) {
    return appRegistry;
  }

  return getRepositoryRegistry();
};
