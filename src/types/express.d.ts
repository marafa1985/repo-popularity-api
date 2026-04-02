declare global {
  namespace Express {
    interface Request {
      /** Set by `createCorrelationId` for every request that hits the middleware chain. */
      requestId?: string;
    }
  }
}

export {};
