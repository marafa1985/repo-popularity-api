import fs from "node:fs";
import path from "node:path";

import winston from "winston";

import type { ILogger } from "@/application/ports/ILogger";
import { env } from "@/config/env";

export class WinstonLogger implements ILogger {
  private readonly logger: winston.Logger;

  constructor() {
    const logDir = env.LOG_DIR ?? "./logs";
    fs.mkdirSync(path.resolve(logDir), { recursive: true });

    this.logger = winston.createLogger({
      level: env.LOG_LEVEL ?? "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({ filename: path.join(logDir, "app.log") }),
        new winston.transports.File({
          filename: path.join(logDir, "error.log"),
          level: "error",
        }),
      ],
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}
