# Meridian Leaderboard API

Small Express + MongoDB backend for the Meridian static site leaderboard. It stores a display name and total focus time (seconds).

## Endpoints

- `GET /leaderboard` — returns users sorted by `totalSeconds` desc.
- `POST /join` — body `{ "name": "YourName" }`. Creates or resumes a user by normalized name and returns `{ userId, name, totalSeconds }`.
- `POST /sync` — body `{ "userId": "...", "totalSeconds": 1234 }`. Atomically stores the greater of the supplied legacy total and the database total, returning the canonical `{ userId, name, totalSeconds }`. Send `0` to read the canonical total without changing it.
- `POST /tick` — body `{ "userId": "...", "seconds": 30 }`. Atomically adds time with a 20-second concurrency guard and returns `{ userId, totalSeconds }`. New clients should include a unique `tickId`; retries of a recent ID are idempotent and return `duplicate: true`. If the concurrency guard rejects an unaccepted tick, the response has `ignored: true`; clients must retain and retry it.
- `GET /` — health message.

## Environment variables

- `MONGODB_URI` (required) — MongoDB connection string (e.g. MongoDB Atlas).
- `PORT` — provided by Render automatically.

## Run locally

```bash
npm install
set MONGODB_URI=your_connection_string   # PowerShell: $env:MONGODB_URI="..."
npm start
```

## Deploy on Render

1. Push this repo to GitHub.
2. In Render: **New + → Web Service** and connect this repo.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add environment variable `MONGODB_URI` with your Atlas connection string.
6. Deploy and use the service URL as the API base.

Notes: `CORS` is enabled for browser requests from the static site. For 5 trusted users, `/join` reuses the same normalized name so you can resume the same record on another device. `/sync` is intended for one-time migration of each user's existing browser total; it never lowers an existing database total. Every user must open the updated site on each device with legacy local data so that device can submit its saved value.
