import { WinstonLogger } from "@/shared/logger";
import { rateLimit } from "express-rate-limit";

const logger = new WinstonLogger();

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  limit: 10, // Limit each IP to 10 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  handler: (_request, response) => {
    logger.warn("Rate limit exceeded for IP", {
      ip: _request.ip,
      method: _request.method,
      query: _request.query,
    });
    response.status(429).json({
      error: "Too many requests, please try again later.",
    });
  },
});
