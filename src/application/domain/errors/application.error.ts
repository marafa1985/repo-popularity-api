export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "APPLICATION_ERROR",
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
  }
}

export class GitHubApiError extends ApplicationError {
  constructor(message: string) {
    super(message, 502, "GITHUB_API_ERROR");
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string) {
    super(message, 429, "RATE_LIMIT_ERROR");
  }
}
