# Meridian

**A minimal clock and focus timer for the browser, delivered as one HTML file.**

Meridian is a Pomodoro style companion: a live clock, a focus timer, and nothing else on screen. Focus, short break, and long break modes come wired with 25, 5, and 15 minute sessions. Each completed focus session leaves a small mark on the dial so you can see the day stacking up between breaks.

## What is on the page

- **Live clock**: a large time readout with seconds in a lighter weight, styled to sit quietly on the page.
- **Focus timer**: three modes you switch between: Focus, Short break, Long break. The label under the dial tells you what the current stretch is for.
- **Cycle marks**: small ticks appear as focus sessions complete, so you can see progress across the day without a full stats page.
- **Dial progress**: a thin progress ring around the timer that drains as the session runs.
- **Ambience controls**: sliders adjust the background image blur and film grain, plus a scrim, so the backdrop can sit fully behind or fade almost out.
- **Sound**: the Web Audio API synthesizes a completion chime and, if you want it, a soft tick tock while the timer runs. No audio files are shipped.
- **Mode transitions**: mode changes ease in with a soft animation instead of snapping.
- **Countdown in the title**: while a session runs, the browser tab title becomes the remaining time and mode, so it stays visible from another tab.

## Design

The palette is warm paper against ink: parchment `#F3ECDD`, brass `#D8B872`, ember `#B8823C`, on dark grounds. Type is Fraunces for display and Inter for interface. The page respects safe area insets on phones, and honors a reduced motion preference.

## Usage

Open `index.html` in any browser. That is the entire setup.

1. Pick Focus (default), Short break, or Long break.
2. Press the main button to start the countdown. The page title mirrors the remaining time.
3. When a focus session ends, the chime plays, a cycle mark is added, and Meridian moves you into a short break automatically. Every fourth completed session rolls into a long break instead.
4. After a break, the timer flips back to focus. Pause and reset are one button each.

## Extra touches

- The apply panel on the page has sliders for background blur and film grain, plus a switch for the tick tock sound.
- The footer time zone chip shows your detected time zone.
- The background photo is Nithilan's own work, credited inline.

No accounts, no keyboard shortcuts to memorize, no service worker. It is a single self contained HTML file.

## Customizing durations

Durations live in one line near the top of the script section:

```js
var DURATIONS = { focus: 25*60, short: 5*60, long: 15*60 };
```

Edit the seconds and save the file to change the rhythm.

## Repository contents

```
meridian/
├── index.html                           # the entire app
└── googlef92e09a8c32be966.html          # search console verification
```

A single 700 KB file covers styles, script, data URIs for assets, and all content. There is no build step, no package manager, and no external JavaScript. Fonts load from Google Fonts.

## Hosting

The file is static, so it runs anywhere: a web host, a LAN server, or straight from disk. To put it on GitHub Pages, drop it into a repository whose Pages source points at it, and it serves as is.

## Transparency notes

- The embedded background photograph makes the file large, but keeps the app portable as one artifact.
- A reduced-motion preference dials animations down to near zero.
- The countdown advances through setInterval ticks, which is exact enough for a focus timer and keeps the logic trivially hackable.
