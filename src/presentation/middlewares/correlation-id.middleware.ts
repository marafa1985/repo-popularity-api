import crypto from "node:crypto";

import type { NextFunction, Request, Response } from "express";

const HEADER = "x-request-id";

export function createCorrelationId() {
  return (request: Request, response: Response, next: NextFunction): void => {
    const incoming = request.get(HEADER);
    const requestId =
      incoming && incoming.trim().length > 0
        ? incoming.trim().slice(0, 128)
        : crypto.randomUUID();

    request.requestId = requestId;
    response.setHeader(HEADER, requestId);
    next();
  };
}
