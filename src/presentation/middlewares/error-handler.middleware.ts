import type { NextFunction, Request, Response } from "express";

import type { ILogger } from "@/application/ports/ILogger";
import { ApplicationError } from "@/application/domain/errors/application.error";

export function createErrorHandler(logger: ILogger) {
  return (
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ): void => {
    if (error instanceof ApplicationError) {
      response.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
      return;
    }

    logger.error("Unhandled application error", {
      requestId: _request.requestId,
      message: error.message,
      stack: error.stack,
    });

    response.status(500).json({
      error: "InternalServerError",
      message: "An unexpected error occurred.",
    });
  };
}
