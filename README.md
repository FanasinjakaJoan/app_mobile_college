# App Mobile Collège 🎓

Mobile application for a college: students browse the current semester's
course catalogue (code, title, professor, credits, schedule), fetched live
from a typed REST API.

| Component | Stack | Location |
| --- | --- | --- |
| Mobile / web client | Flutter (Material 3, zero state-management dependencies) | repository root (`lib/`) |
| Backend API | Node.js, Express 5, TypeScript (strict) | [`my-backend-app/`](my-backend-app/) |

## Architecture

```
┌─────────────────────────────┐         HTTP/JSON          ┌─────────────────────────────┐
│ Flutter app (lib/)          │ ──────────────────────────▶ │ Express API (my-backend-app)│
│                             │                             │                             │
│ ui → controller → repository│                             │ routes → controllers →      │
│         ↓                   │                             │ models (CourseStore)        │
│ ApiClient (timeouts, errors)│                             │ helmet · CORS · rate-limit  │
└─────────────────────────────┘                             └─────────────────────────────┘
```

The Flutter layering follows a lightweight Clean Architecture:

- `core/` — API configuration, HTTP client, typed error model.
- `features/courses/models/` — immutable, defensively parsed entities.
- `features/courses/repositories/` — data-source abstraction (interface + HTTP implementation), so tests never touch the network.
- `features/courses/controllers/` — a `ChangeNotifier` state machine (`idle → loading → success | error`).
- `features/courses/ui/` — screens and widgets covering **loading, success, empty and error** states (with retry + pull-to-refresh).

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) ≥ 3.32 (Dart ≥ 3.8)
- [Node.js](https://nodejs.org) ≥ 18 and npm

## 1. Run the backend

```sh
cd my-backend-app
cp .env.example .env      # then adjust values if needed
npm install
npm run dev               # starts http://localhost:3000 with hot reload
```

Production mode:

```sh
npm run build             # type-checks and compiles to dist/
npm start                 # node dist/server.js
```

### API reference

| Method | Path | Description | Errors |
| --- | --- | --- | --- |
| GET | `/api` | API banner + version | — |
| GET | `/api/health` | Liveness probe (uptime, timestamp) | — |
| GET | `/api/courses` | List all courses `{ count, data }` | — |
| GET | `/api/courses/:id` | Single course | `400` bad id, `404` unknown |
| POST | `/api/courses` | Create a course (validated payload) | `400` invalid JSON/fields |

Example:

```sh
curl -X POST http://localhost:3000/api/courses \
  -H 'Content-Type: application/json' \
  -d '{"code":"PHY-210","title":"Physique générale","professor":"Dr. P. Randria","credits":4,"schedule":"Samedi 08:00 – 10:00 · Amphi B"}'
```

### Environment variables (`my-backend-app/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `HOST` | `0.0.0.0` | Bind interface |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `CORS_ORIGIN` | `*` | Allowed CORS origin (lock down in production) |
| `RATE_LIMIT_MAX` | `300` | Requests per IP per 15 min window |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |

> `.env` is git-ignored; only `.env.example` is committed — never put
> credentials in source code.

## 2. Run the Flutter app

The app needs to know where the API lives. The base URL is injected at
**build time** (no secret ever lands in the source tree):

```sh
flutter pub get

# Android emulator (10.0.2.2 aliases the host machine — also the default)
flutter run

# iOS simulator / desktop / web
flutter run --dart-define=API_BASE_URL=http://localhost:3000

# Against a deployed API
flutter run --dart-define=API_BASE_URL=https://api.example.com --release
```

Notes:

- Android release builds need INTERNET permission — already declared in
  `android/app/src/main/AndroidManifest.xml`.
- Plain `http://` is only allowed in debug/profile builds (cleartext flag in
  the debug manifests); use HTTPS for production deployments.

### Tests, analysis, builds

```sh
flutter analyze        # zero issues expected
flutter test           # hermetic widget tests (fake repository, no network)

flutter build apk      # Android release bundle
flutter build web      # web build in build/web/
flutter build ios      # iOS (requires macOS/Xcode)
```

## Deployment

**Backend** — a multi-stage `Dockerfile` is provided:

```sh
cd my-backend-app
docker build -t app-mobile-college-api .
docker run --rm -p 3000:3000 --env-file .env app-mobile-college-api
```

The image runs as the unprivileged `node` user and ships a
`/api/health` healthcheck; it deploys unchanged to Cloud Run, Fly.io,
Render, Railway, ECS, …

**Flutter** — point `API_BASE_URL` at the deployed API:

```sh
flutter build apk --dart-define=API_BASE_URL=https://api.example.com
flutter build web --dart-define=API_BASE_URL=https://api.example.com
```

For web, also set `CORS_ORIGIN` on the API to the site's origin.

## Project structure

```
app_mobile_college/
├── lib/                          # Flutter application
│   ├── main.dart                 # entry point
│   ├── app.dart                  # MaterialApp + theming wiring
│   ├── core/                     # ApiClient, ApiConfig, ApiException
│   ├── features/courses/         # models / repositories / controllers / ui
│   └── theme/                    # Material 3 light & dark themes
├── test/widget_test.dart         # state-machine widget tests (no network)
├── my-backend-app/               # Express 5 + TypeScript REST API
│   ├── src/
│   │   ├── server.ts             # bootstrap + graceful shutdown
│   │   ├── app.ts                # express app factory (security middleware)
│   │   ├── config/               # validated env configuration (dotenv)
│   │   ├── routes/               # /api router
│   │   ├── controllers/          # request handlers + input validation
│   │   ├── middleware/           # 404 + central JSON error handler
│   │   ├── models/               # Course entity + in-memory store
│   │   └── utils/                # structured JSON logger
│   ├── .env.example
│   └── Dockerfile
└── android|ios|web|…             # platform shells
```

## Security checklist

- ✅ No API keys or credentials in the codebase (verified by audit); all
  runtime configuration flows through `.env` / `--dart-define`.
- ✅ `helmet` security headers, CORS allow-list, request rate limiting and a
  10 KB body cap on the API.
- ✅ Every client input is validated; all failures return a uniform JSON
  error envelope without leaking internals.
- ✅ Defensive JSON parsing on the client — malformed payloads degrade
  gracefully instead of crashing.
- ✅ Production Docker image runs as a non-root user.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| App stuck on the error state (Android emulator) | Make sure the API is running on the host and reachable at `http://10.0.2.2:3000` (or pass the right `API_BASE_URL`). |
| App stuck on the error state (iOS simulator/web) | Use `--dart-define=API_BASE_URL=http://localhost:3000`. |
| `CORS` errors in the browser | Set `CORS_ORIGIN` in `.env` to the web app's origin. |
| `429 Too Many Requests` | Raise `RATE_LIMIT_MAX` for local load testing. |
