# Meridian

A minimal clock and focus timer for the browser, with a shared live leaderboard.

Meridian is a calm Pomodoro-style companion: a live clock, a focus timer, and lightweight focus-time tracking. Focus, short break, and long break modes are set to 25, 5, and 15 minutes. Completed focus sessions add marks on the dial so you can see progress through each cycle.

## Features

- **Live clock** with date and local time zone.
- **Focus timer** with Focus, Short break, and Long break modes.
- **Cycle marks** and a progress ring around the timer.
- **Ambience controls** for background blur, film grain, themes, and optional tick-tock sound.
- **Focus card export/share**: create a photo-backed PNG of your total focus time.
- **Live leaderboard**: join with a name once on your device; focus time syncs to the backend in 30-second chunks while a focus session is running.

## Usage

1. Open `index.html` in a browser, or visit the GitHub Pages site.
2. Choose Focus, Short break, or Long break.
3. Press **Start focusing** to run the timer. While running, the tab title shows the remaining time.
4. When a focus session ends, Meridian adds a cycle mark and moves into a break automatically (a long break after every fourth focus session).
5. Open the **Effects** panel to adjust blur/grain, change theme, toggle sound, export/share a focus card, or use the leaderboard.

### Leaderboard

- In the **Effects** panel, enter your name and press **Join** (saved on this device/browser).
- After joining, the name field is hidden on this device. Use **Change name** to clear the saved name on this device and join again.
- While the timer is running in **Focus** mode, time syncs every ~30 seconds and the leaderboard refreshes periodically.
- The frontend is configured to use `https://meridian-s5cw.onrender.com` for leaderboard data.

## Repository contents

```text
meridian/
├─ index.html                  # static frontend app
├─ leaderboard-api/            # Express + MongoDB backend API
│  ├─ index.js
│  ├─ package.json
│  ├─ README.md
│  └─ .gitignore
├─ .github/workflows/
│  └─ deploy-pages.yml         # GitHub Pages deploy workflow
├─ googlef92e09a8c32be966.html # search console verification
├─ .nojekyll
└─ README.md
```

## Frontend

- `index.html` is the static frontend (styles, scripts, and embedded assets in one file). Fonts are loaded from Google Fonts (Fraunces and Inter).
- The embedded background image makes the file large (~19.6 MB) but keeps it portable as a single page.
- Timer durations are defined in `index.html`:

```js
var DURATIONS = { focus: 25*60, short: 5*60, long: 15*60 };
```

## Backend (`leaderboard-api/`)

The leaderboard uses a small Express + MongoDB API.

- **Endpoints:** `GET /leaderboard`, `POST /join` `{ "name": "..." }`, `POST /tick` `{ "userId": "...", "seconds": 30 }`, `GET /` (health)
- Stores a display name and total focus time in seconds. Joining the same normalized name resumes that record.

### Deploy on Render

1. Create a Web Service from this repository.
2. Set **Root Directory** to `leaderboard-api`.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add environment variable `MONGODB_URI` (MongoDB Atlas connection string).

See [`leaderboard-api/README.md`](leaderboard-api/README.md) for API details.

## Hosting

- **Frontend:** deployed to GitHub Pages via GitHub Actions (`.github/workflows/deploy-pages.yml`).
- **Backend:** deployed separately (e.g. Render) and called by the static frontend. CORS is enabled in the API.

## Notes

- Leaderboard time syncs in 30-second chunks while focusing; brief unsynced time can be lost on reload/close.
- A reduced-motion preference is respected for animations.
- The frontend remains static; leaderboard features depend on the configured backend being available.
