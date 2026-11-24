# rumahharmonis-backend

REST API behind **Rumah Harmonis**, a family-counselling website. It serves the landing-page content (counselling packages, counsellors, testimonials, online classes) and handles user accounts.

Originally written in 2023; refactored in 2026 for security, correctness and maintainability.

## Stack

Node.js 20+, Express 4, MongoDB (Mongoose 8), JWT access + rotating refresh token, Joi, Helmet, express-rate-limit.

## API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/user/register` | – | Create account |
| POST | `/api/user/login` | – | Returns `{ token }` + httpOnly `refreshToken` cookie |
| POST | `/api/user/token` (alias `GET /api/user/refreshToken`) | cookie | Rotate refresh token, new access token |
| DELETE | `/api/user/logout` | cookie | Revoke current session |
| GET / PUT / DELETE | `/api/user/profile` | Bearer | Read / update / delete own account |
| GET | `/api/kelas/getKelas` | – | Online classes |
| GET | `/api/props/getProps` | – | Packages, testimonials, counsellors (one round-trip) |
| POST | `/api/kelas/addKelas`, `/api/props/addPaket`, `/addTesti`, `/addKonselor` | admin | Manage landing-page content |
| GET | `/healthz` | – | Liveness probe |

Admins are regular users with `role: "admin"` set directly in the database.

## What changed in the refactor

**Security**
- Secrets and DB URI moved to env vars (`.env.example`); the app fails fast if they are missing. `.env` removed from the repository.
- Content-management endpoints (`add*`) were public — now require an admin token.
- `GET /api/user/token` used to return the full user document **including the password hash**; profile used to return the refresh token. Responses now contain only `name/email/address`, and sensitive fields are `select: false`.
- Access tokens carry the user id (`sub`), not the display name, and are verified with a pinned algorithm. Invalid tokens return `401` (was `404`).
- Refresh tokens are stored hashed, rotated on every use, max 5 sessions; replaying a used refresh token revokes all sessions.
- Logout revokes the session from the cookie (it used to clear tokens of whatever email was sent in the body).
- bcrypt cost 12, min password length 8, same error for unknown email / wrong password with a dummy hash compare (no user enumeration), rate limit on login/register.
- Helmet headers, CORS allow-list instead of `*`, body size limit, centralized error handler (no stack traces or raw Mongo errors to clients).

**Correctness & concurrency**
- Schema options were written as `Required` (capital R) so Mongoose ignored them — validation was effectively off. Fixed, plus Joi validation with `stripUnknown` on every write.
- "Check if exists, then insert" for emails/packages/classes was racy: two parallel requests could both pass the check. Replaced by unique indexes and mapping duplicate-key errors to `409`.
- Update/delete profile handlers were never mounted and looked users up by name as if it were an id. Rewritten and mounted.
- Unhandled async errors used to leave requests hanging; all handlers now go through `asyncHandler` + error middleware.

**Performance**
- `getProps` runs its three queries in parallel (`Promise.all`) with `.lean()` and field projection, and sets a short `Cache-Control` since the data is near-static.
- Connection pooling with a cached connection promise; graceful shutdown on `SIGTERM`.

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

```bash
npm run lint
docker run -d --rm -p 27017:27017 --name mongo mongo:7
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/rh_test npm test
```

The integration test registers the same email concurrently, inserts the same package concurrently and replays a refresh token in parallel, and checks that exactly one request wins each time.
