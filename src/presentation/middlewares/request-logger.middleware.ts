import type { Request, Response, NextFunction } from "express";

import type { ILogger } from "@/application/ports/ILogger";

export function createRequestLogger(logger: ILogger) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = Date.now();

    response.on("finish", () => {
      logger.info("HTTP request completed", {
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        latencyMs: Date.now() - startedAt,
      });
    });

    next();
  };
}
