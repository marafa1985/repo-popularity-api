export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Score GitHub API",
    version: "1.0.0",
    description:
      "API for searching GitHub repositories and ranking them by popularity.",
  },
  tags: [
    {
      name: "Repositories",
      description: "Search and score GitHub repositories.",
    },
    {
      name: "System",
      description: "Operational endpoints.",
    },
  ],
  components: {
    schemas: {
      ScoredRepository: {
        type: "object",
        required: [
          "id",
          "name",
          "fullName",
          "url",
          "stars",
          "forks",
          "updatedAt",
          "popularityScore",
        ],
        properties: {
          id: {
            type: "integer",
            example: 123456,
          },
          name: {
            type: "string",
            description: "Repository name.",
            example: "awesome-typescript",
          },
          fullName: {
            type: "string",
            description: "Repository full name.",
            example: "owner/awesome-typescript",
          },
          url: {
            type: "string",
            format: "uri",
            description: "Repository URL.",
            example: "https://github.com/owner/awesome-typescript",
          },
          description: {
            type: "string",
            nullable: true,
            example: "A curated list of awesome TypeScript resources.",
          },
          language: {
            type: "string",
            nullable: true,
            example: "TypeScript",
          },
          stars: {
            type: "number",
            example: 12000,
          },
          forks: {
            type: "number",
            example: 1800,
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2026-03-31T18:22:14Z",
          },
          popularityScore: {
            type: "number",
            minimum: 0,
            maximum: 100,
            example: 88.4,
          },
        },
      },
      SearchPopularRepositoriesResponse: {
        type: "object",
        required: ["filters", "pagination", "items"],
        properties: {
          filters: {
            type: "object",
            required: ["createdAfter", "language"],
            properties: {
              createdAfter: {
                type: "string",
                format: "date",
                example: "2025-01-01",
              },
              language: {
                type: "string",
                example: "TypeScript",
              },
            },
          },
          pagination: {
            type: "object",
            required: ["page", "perPage", "totalCount", "returnedCount"],
            properties: {
              page: {
                type: "integer",
                minimum: 1,
                example: 1,
              },
              perPage: {
                type: "integer",
                minimum: 1,
                example: 10,
              },
              totalCount: {
                type: "integer",
                minimum: 0,
                example: 10,
              },
              returnedCount: {
                type: "integer",
                minimum: 0,
                example: 10,
              },
            },
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ScoredRepository",
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error", "message"],
        properties: {
          error: {
            type: "string",
            example: "ValidationError",
          },
          message: {
            type: "string",
            example: 'Query parameter "language" is required.',
          },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            example: "ok",
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/repositories/popularity": {
      get: {
        tags: ["Repositories"],
        summary: "Search popular repositories",
        description:
          "Search GitHub repositories created after a given date, filter by language, and return them ordered by computed popularity score with pagination metadata.",
        parameters: [
          {
            in: "query",
            name: "createdAfter",
            required: true,
            schema: {
              type: "string",
              format: "date",
            },
            description:
              "Only include repositories created on or after this UTC date.",
            example: "2025-01-01",
          },
          {
            in: "query",
            name: "language",
            required: true,
            schema: {
              type: "string",
            },
            description: "Programming language used to filter repositories.",
            example: "TypeScript",
          },
          {
            in: "query",
            name: "page",
            required: true,
            schema: {
              type: "integer",
              minimum: 1,
            },
            description: "Results page number.",
            example: 1,
          },
          {
            in: "query",
            name: "perPage",
            required: true,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
            },
            description: "Maximum number of repositories to return per page.",
            example: 10,
          },
        ],
        responses: {
          "200": {
            description: "Repositories sorted by popularity score.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SearchPopularRepositoriesResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameters.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            description: "GitHub API rate limit reached.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Unexpected server error.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "502": {
            description: "GitHub API upstream error.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
