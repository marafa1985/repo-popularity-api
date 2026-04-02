import type { ILogger } from "@/application/ports/ILogger";
import { rateLimit } from "express-rate-limit";

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function createRepositoryRateLimiter(
  windowMs = 60_000,
  maxRequests = 10,
  logger: ILogger,
) {
  return rateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: 56,
    handler: (request, response, _next, optionsUsed) => {
      logger.warn("Request rate limit exceeded", {
        path: request.path,
        method: request.method,
        clientIp: request.ip,
        maxRequests,
        windowMs,
      });
      const retryAfterSec = Math.ceil(optionsUsed.windowMs / 1000);
      response.setHeader("Retry-After", String(retryAfterSec));
      response.status(429).json({
        error: "RateLimitError",
        message: "Too many requests. Please try again later.",
      });
    },
  });
}
