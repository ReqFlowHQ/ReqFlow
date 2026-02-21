import { createRepositoryRegistry } from "./factory";
import type { RepositoryRegistry } from "./interfaces";

let repositoryRegistry: RepositoryRegistry | null = null;

export const setRepositoryRegistry = (registry: RepositoryRegistry): void => {
  repositoryRegistry = registry;
};

export const getRepositoryRegistry = (): RepositoryRegistry => {
  if (!repositoryRegistry) {
    repositoryRegistry = createRepositoryRegistry();
  }
  return repositoryRegistry;
};
