# Score GitHub

A small backend service that searches GitHub repositories and re-ranks them with a popularity score.

I built this as a focused API exercise: take GitHub's search results, apply a scoring formula that is a little easier to reason about than raw stars alone, and return something clean enough to consume from another app.

## What It Actually Does

- Exposes `GET /api/v1/repositories/popularity`
- Calls the GitHub Search API with `language` and `createdAfter`
- Scores each result using stars, forks, and recent activity
- Returns pagination metadata along with the scored repositories
- Serves Swagger docs at `/api-docs`

## A Couple Of Tradeoffs

- The popularity score is heuristic. It is useful for ranking, but it is not meant to be an objective measure of repository quality.
- GitHub search only lets you page through the first `1000` matching results, so this API validates that limit up front.
- The cache is in-memory, which keeps the project simple but means cached data disappears on restart.

## Stack

- Node.js
- TypeScript
- Express
- Axios
- Zod
- Jest
- Winston

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

The server runs on `http://localhost:3000` by default.

Try this once it is running:

```bash
curl "http://localhost:3000/api/v1/repositories/popularity?createdAfter=2026-01-01&language=TypeScript&page=1&perPage=10"
```

## Scripts

- `npm run dev` starts the app in watch mode
- `npm run build` builds the project into `dist`
- `npm start` runs the built app
- `npm test` runs the test suite
- `npm run test:cov` runs the test suite with coverage
- `npm run lint` runs ESLint
- `npm run format:check` checks formatting with Prettier

### Security

- `npm run security:audit` runs [`npm audit`](https://docs.npmjs.com/cli/v10/commands/npm-audit) against the public npm registry (`https://registry.npmjs.org/`). The process exits with a non-zero code if any dependency reports a vulnerability at **moderate** severity or higher (`--audit-level moderate`), so you can use it in CI or before releases.
- `npm run security:audit:fix` runs [`npm audit --fix`](https://docs.npmjs.com/cli/v10/commands/npm-audit) against the same registry. npm applies compatible version bumps from the lockfile where it can resolve issues automatically. Review the resulting `package-lock.json` (and any semver changes) and re-run tests; not every finding can be fixed this way, and some fixes may need manual dependency upgrades or overrides.

## Environment Variables

- `PORT`: HTTP port, defaults to `3000`
- `GITHUB_API_URL`: GitHub API base URL
- `GITHUB_TIMEOUT_MS`: upstream GitHub request timeout in milliseconds, defaults to `5000`
- `CACHE_TTL_SECONDS`: in-memory cache TTL, defaults to `300`
- `LOG_LEVEL`: Winston log level
- `LOG_DIR`: directory for log files
- `RATE_LIMIT_WINDOW_MS`: rate-limit window in milliseconds, defaults to `60000`
- `RATE_LIMIT_MAX_REQUESTS`: maximum requests per client IP within the window, defaults to `10`

## API Contract

### `GET /api/v1/repositories/popularity`

Required query parameters:

- `createdAfter`: UTC date in `YYYY-MM-DD` format, not in the future
- `language`: non-empty language name
- `page`: integer greater than or equal to `1`
- `perPage`: integer between `1` and `100`

Additional request constraints:

- Pagination is limited to GitHub Search API's first `1000` matching results
- Requests beyond that limit return a validation error before calling GitHub

Response shape:

- `filters`: normalized request filters
- `pagination.page`: requested page
- `pagination.perPage`: requested page size
- `pagination.totalCount`: total number of upstream matches reported by GitHub
- `pagination.returnedCount`: number of scored items returned in the current response
- `items`: repositories sorted by `popularityScore` descending

Rate limiting:

- Only routes under `/api/v1/repositories/` are limited (for example, `GET /health`, `/openapi.json`, and `/api-docs` are not).
- Clients are identified by IP; IPv6 addresses are grouped using a `/56` subnet prefix (same default as `express-rate-limit`).
- Successful responses include IETF **draft-8** rate limit metadata: `RateLimit` and `RateLimit-Policy`. Legacy `X-RateLimit-*` headers are disabled.
- When the limit is exceeded, the API responds with `429 Too Many Requests`, a JSON body (`error: "RateLimitError"`, `message` describing the condition), and a `Retry-After` header whose value is the suggested wait time in seconds (based on the configured window).

## Scoring

`popularityScore` is a weighted score from `0` to `100` based on:

- stars
- forks
- recency of activity

The implementation uses logarithmic normalization for stars and forks so very large repositories do not overwhelm everything else. Recency uses exponential decay with a one-year half-life, which gives active repositories a noticeable boost without making stars and forks irrelevant.
