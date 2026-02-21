import { randomBytes } from "crypto";

export const generateObjectIdLike = (): string => randomBytes(12).toString("hex");
