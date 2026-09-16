# App Mobile College — API

REST API backing the Flutter app. Built with **Express 5** and **TypeScript
(strict mode)**. The complete documentation (API reference, environment
variables, Docker deployment) lives in the [root README](../README.md).

## Quick start

```sh
cp .env.example .env   # adjust values if needed
npm install
npm run dev            # http://localhost:3000 with hot reload
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with hot reload (`ts-node-dev`) |
| `npm run build` | Type-check & compile to `dist/` |
| `npm run typecheck` | Type-check without emitting |
| `npm start` | Run the compiled server (`node dist/server.js`) |

## Endpoints

- `GET /api` — API banner (name, version, endpoint index)
- `GET /api/health` — liveness probe
- `GET /api/courses` — list courses
- `GET /api/courses/:id` — fetch one course
- `POST /api/courses` — create a course (validated)

## Structure

```
src/
├── server.ts          # bootstrap + graceful shutdown (SIGINT/SIGTERM)
├── app.ts             # express app factory: helmet, CORS, rate limit, JSON
├── config/            # validated environment configuration (dotenv)
├── routes/            # /api router composition
├── controllers/       # request handlers + payload validation
├── middleware/        # 404 + central error handler (uniform JSON errors)
├── models/            # Course entity + in-memory CourseStore
└── utils/             # structured JSON logger
```

## Security notes

- All configuration comes from the environment (`.env`); nothing is
  hardcoded. `.env` is git-ignored — `.env.example` documents every variable.
- Requests are protected by `helmet`, a CORS allow-list, rate limiting and a
  10 KB body size cap.
- Controller-level validation rejects malformed ids and payloads with `400`
  responses describing each invalid field.
