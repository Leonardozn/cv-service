# cv-service

Backend microservice that owns a user's CV content — one `Curriculum` per user plus its `Education`,
`Experience` and `Certificate` entries — and the configurable `Skill`/`Template` catalogs, and
renders a Curriculum into a downloadable PDF on demand. Authentication is delegated to an external
auth-service via bearer-token introspection.

## Features

- CRUD for `Curriculum` (max one per authenticated user; `POST /curriculum` creates it the first
  time and updates it on every later call — always responds `200`, never `201`), including an
  optional profile photo upload (`multipart/form-data`, field `photo`).
- CRUD for `Education`, `Experience` and `Certificate` entries, each scoped to its parent
  `Curriculum`.
- `Skill` and `Template` catalogs: reading (`list`/`get`) only requires a valid session (any role);
  writing (`create`/`update`/`delete`) requires the `admin` role.
- Any skill name typed into `Curriculum.skills` that isn't already in the `Skill` catalog is
  auto-registered there as active (`apps/api/src/services/commands/registerNewSkills.js`), in the
  same transaction as the Curriculum save — never through the `/skill` HTTP route.
- On-demand `POST /curriculum/:id/generate-pdf`: renders the Curriculum (with its Education,
  Experience and Certificate entries, sorted by date descending) into a PDF with `@react-pdf/renderer`
  (`packages/pdf-generator`), using the requested `Template` or the active default one. The PDF is
  streamed back as a binary download — nothing is persisted.
- Ownership scoping is enforced per model (`*Management` services): a non-admin caller only ever
  sees/acts on their own `Curriculum` and its entries; an admin can act on any. A record owned by
  someone else is reported as `404`, identical to one that doesn't exist.
- Authentication is delegated to an external auth-service: every protected route forwards the
  caller's bearer token to `POST {AUTH_SERVICE_URL}/auth/validate` (`packages/auth-middleware`),
  fails closed on an invalid/expired token or on auth-service being unreachable, and retries once on
  timeout before giving up.
- File storage is pluggable: local disk by default, or an S3-compatible bucket when
  `API_UPLOAD_PATH` starts with `s3://` (`packages/file-manager`); uploads are capped by size and
  restricted by mimetype.
- OpenAPI/Swagger documentation generated from JSDoc annotations in the route files, served at
  `/api-docs`.
- Prometheus metrics (HTTP request rate/errors/duration + Node process metrics) exposed at
  `/metrics`, optionally gated behind a bearer token.
- CORS origin whitelist, a baseline per-IP rate limiter, and security response headers (helmet)
  applied globally to every response.

## Prerequisites

- Node.js 22 — the Docker image is built from `node:22-bookworm-slim` (`Dockerfile`); CI
  (`.github/workflows/ci.yml`) additionally runs lint/tests against Node 24. No `engines` field is
  declared in `package.json`, so this is a convention rather than an enforced constraint.
- npm with [workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) support — the root
  `package.json` declares `apps/*` and `packages/*` as workspaces.
- A reachable MongoDB instance for the `cv` database (own database, separate from any other
  service's).
- A reachable auth-service instance for any authenticated route to succeed (`AUTH_SERVICE_URL`).

## Installation

```bash
npm install
```

This is an npm-workspaces monorepo (`apps/api` plus every package under `packages/*`); a single
install at the repository root resolves all of them. `npm run prepare` (wired to `npm install` via
the `prepare` lifecycle script) points git at `.githooks/` for the local commit hooks
(`commit-msg` running commitlint, `pre-commit` running lint + tests) — this is dropped in the Docker
image (`npm pkg delete scripts.prepare`), since a container has no `.git` directory.

Configuration is provided via environment variables — `packages/env-variables/src/envVariables.js`
loads a `.env` file at the project root via `dotenv` (`dotenv.config({ path: `${process.cwd()}/.env`
})`); see [Configuration](#configuration) below for what to set there.

## Configuration

Environment variables actually read by the service (`packages/env-variables/src/envVariables.js`).
"Default" is listed only where the code itself falls back to a value when the variable is unset —
every other variable has no runtime fallback and must be provided explicitly.

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `API_PORT` | Port the HTTP server binds to. | none |
| `API_HOST` | Host/interface the HTTP server binds to (the Docker image forces `0.0.0.0` via `ENV`). | none |
| `API_PATH` | Path prefix every model route (and the file-serving route) is mounted under, e.g. `/api`. | none |
| `DEVELOP_MODE` | `'true'` switches the generated Swagger server URL to `http`, and disables HSTS in the security headers. | none |
| `API_UPLOAD_PATH` | Destination for uploaded files: a local absolute path, or `s3://<bucket>` to switch to S3-compatible storage. | `<service-root>/api-uploads` |
| `API_UPLOAD_INCLUDE_PATHS` | Comma-separated route name(s) that get the file-upload (multer) middleware mounted after auth. | none (no upload middleware mounted) |
| `API_FILE_FIELDS` | Comma-separated field names (e.g. `photo`) treated as file references when building response paths (`services/*.js` `_getFilePaths`). | none (no path mapping applied) |
| `CV_DATABASE_NAME` | Mongo database name, used to build the discrete-vars connection string. | none |
| `CV_DATABASE_HOST` | Mongo host, used to build the discrete-vars connection string. | none |
| `CV_DATABASE_PORT` | Mongo port, used to build the discrete-vars connection string. | none |
| `CV_DATABASE_USERNAME` | Mongo username, used to build the discrete-vars connection string. | none |
| `CV_DATABASE_PASSWORD` | Mongo password, used to build the discrete-vars connection string. | none |
| `CV_DATABASE_AUTO_CREATE` | Parsed as JSON and passed to `mongoose.set('autoCreate', ...)`. | none (must be valid JSON, e.g. `"false"`) |
| `CV_MONGODB_URI` | Full Mongo connection URI; when set, used instead of the discrete `CV_DATABASE_*` vars. | none |
| `CV_DATABASE_REPLICA_SET` | Replica set name passed to the mongoose connection options. | none |
| `AUTH_SERVICE_URL` | Base URL of the auth-service that `POST /auth/validate` is called against. | `http://localhost:4000` |
| `METRICS_ROUTE` | Path the Prometheus scrape endpoint is served on. | `/metrics` |
| `METRICS_PREFIX` | Prefix prepended to every metric name. | `''` |
| `METRICS_TOKEN` | Bearer token required to scrape `/metrics`; empty leaves it public. | `''` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origin whitelist; empty leaves CORS open (`origin: '*'`). | `''` |
| `API_UPLOAD_MAX_FILE_SIZE` | Max upload size in bytes. | `5242880` (5 MB) |
| `API_UPLOAD_ALLOWED_FORMATS` | Comma-separated allowed upload mimetypes. | `image/jpeg,image/png,image/webp` |
| `RATE_LIMIT_WINDOW_MS` | Rolling window (ms) for the baseline per-IP rate limiter. | `60000` |
| `RATE_LIMIT_MAX` | Max requests per IP per window before a `429`. | `300` |
| `SECURITY_CORP_POLICY` | `Cross-Origin-Resource-Policy` header value (helmet). | `cross-origin` |
| `API_S3_ENDPOINT` | S3-compatible endpoint URL. Only used when `API_UPLOAD_PATH` starts with `s3://`. | none |
| `API_S3_REGION` | S3 region (e.g. `auto` for Railway's bucket). Only used with S3 storage. | none |
| `API_S3_ACCESS_KEY_ID` | S3 access key. Only used with S3 storage. | none |
| `API_S3_SECRET_ACCESS_KEY` | S3 secret key. Only used with S3 storage. | none |

## Usage

```bash
# Start the API (equivalent to `node apps/api/index.js`)
npm start
# or
npm run start-api

# Stop the running process
npm stop
# or
npm run stop-api

# Lint every workspace
npm run lint

# Run the full test suite (unit + e2e + smoke + crud)
npm test
```

Once running, the API is served under `<API_HOST>:<API_PORT><API_PATH>` (e.g.
`http://localhost:3000/api`), Swagger UI at `/api-docs`, and Prometheus metrics at `/metrics`
(both mounted at the app root, outside `API_PATH`).

## API / Route reference

Every model route below is mounted under `API_PATH` (e.g. `/api/curriculum`). Every response other
than the PDF download uses the envelope `{ success, message, statusCode, content }`
(`packages/handle-response`). Full request/response shapes and examples are documented as OpenAPI
annotations in each route file (`apps/api/src/routes/*.js`) and served live at `/api-docs`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/curriculum` | any authenticated user | Create-or-update the caller's own `Curriculum` (idempotent; always `200`). Accepts JSON or `multipart/form-data` (photo upload). |
| GET | `/curriculum` | any authenticated user | List Curriculums — non-admin sees only their own, admin sees all. Supports `query[field]`, `query[field][operator]`, `sort[field]`, `size`, `page`, `virtuals`. |
| GET | `/curriculum/:id` | any authenticated user | Get a Curriculum by id (own, or any for admin). `404` if missing or owned by someone else. |
| PUT | `/curriculum/:id` | any authenticated user | Replace a Curriculum. |
| PATCH | `/curriculum/:id` | any authenticated user | Update a Curriculum (also auto-registers new `skills` into the Skill catalog). |
| DELETE | `/curriculum/:id` | any authenticated user | Delete a Curriculum. |
| POST | `/curriculum/:id/generate-pdf` | any authenticated user | Render the Curriculum's PDF; optional body `{ template: <Template id> }`, defaults to the active Template. Returns a binary `application/pdf` download, not the JSON envelope. |
| POST / GET / GET `:id` / PUT / PATCH / DELETE | `/education` | any authenticated user | CRUD of Education entries, scoped to their parent Curriculum's owner. |
| POST / GET / GET `:id` / PUT / PATCH / DELETE | `/experience` | any authenticated user | CRUD of Experience entries, scoped to their parent Curriculum's owner. |
| POST / GET / GET `:id` / PUT / PATCH / DELETE | `/certificate` | any authenticated user | CRUD of Certificate entries, scoped to their parent Curriculum's owner. |
| GET / GET `:id` | `/skill` | any authenticated user | List/get Skill catalog entries (autocomplete source). |
| POST / PUT / PATCH / DELETE | `/skill` | `admin` only | Write the Skill catalog. |
| GET / GET `:id` | `/template` | any authenticated user | List/get Template catalog entries (CV design selector). |
| POST / PUT / PATCH / DELETE | `/template` | `admin` only | Write the Template catalog. |
| GET | `/health` | public | Liveness check; returns `{ success: true, content: 'Ok' }`. |
| GET | `/files/*` (or static under `/files`) | public | Serves uploaded files — proxied through the storage provider when `API_UPLOAD_PATH` is `s3://...`, or as a static folder otherwise. |

Outside `API_PATH` (mounted at the app root):

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api-docs` | public | Swagger UI generated from the route files' OpenAPI annotations. |
| GET | `/metrics` | public, unless `METRICS_TOKEN` is set (then `Authorization: Bearer <token>`) | Prometheus scrape endpoint (HTTP RED metrics + Node process metrics). |

Common status codes across model routes: `200` success (including create — this service never
returns `201`), `400` validation error or a request that fails a business rule, `401` missing/
invalid/expired session, `403` authenticated but wrong role (catalog writes), `404` record not
found or not owned by the caller, `500` unexpected error, `502` auth-service unreachable/misbehaving.

### auth-service dependency

Every protected route resolves the caller through `packages/auth-middleware`, which forwards the
`Authorization: Bearer <token>` header to `POST {AUTH_SERVICE_URL}/auth/validate` on an external
auth-service and trusts the returned `user` (with its `role`) for local RBAC. The token itself is
never decoded locally. A timeout gets exactly one retry; any other failure (auth-service down, a
genuine `401`) fails the request closed.

## Project structure

```
cv-service/
├── apps/
│   └── api/                # The REST API application
│       ├── index.js         # Entry point: wires handlers, middleware order and routes, starts the HTTP server
│       └── src/
│           ├── contracts/    # Response field whitelisting per model
│           ├── controllers/  # HTTP layer: parse request, call service, build response
│           ├── handlers/     # Thin adapters instantiating each package for this app
│           ├── interfaces/   # Per-model request/response type shapes
│           ├── models/       # Mongoose models
│           ├── repositories/ # Data-access layer used by services
│           ├── routes/       # Express route definitions + OpenAPI (Swagger) annotations
│           └── services/     # Business logic, including services/commands/ (multi-step operations)
├── packages/                # Internal npm-workspace packages (env vars, db connection, auth
│                             # middleware, file manager, pdf generator, rate limiter, etc.)
├── assets/templates/         # Template preview images baked into the image (catalog assets)
├── api-uploads/               # User-uploaded files (profile photos) on local disk storage; also
│                             # where docker-entrypoint.sh copies assets/templates/*.png on start
├── settings.json             # easy-node scaffold: model field definitions + env var catalog
├── Dockerfile                 # Node 22 image; installs workspaces, copies catalog assets in
├── docker-entrypoint.sh       # Syncs assets/templates/*.png into API_UPLOAD_PATH on every start
└── package.json                # Root workspace manifest and scripts
```

## Testing

```bash
npm test           # unit + e2e + smoke + crud
npm run test:unit  # apps/*/tests/unit/**/*.test.js
npm run test:e2e   # apps/*/tests/e2e/**/*.test.js
npm run test:smoke # apps/*/tests/smoke/**/*.test.js
npm run test:crud  # apps/*/tests/crud/**/*.test.js
```

Tests run on Node's built-in test runner (`node --test`). `apps/api/tests/support/` provides
preload mocks (repository, db-connections, external-api-config, file-manager) used to run the suite
without a real MongoDB or auth-service.
