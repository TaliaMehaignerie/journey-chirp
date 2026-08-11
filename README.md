# Chirps

A single full-screen button. Short tap plays a random clip from
`chirps/short`, a press-and-hold (500ms+) plays a random clip from
`chirps/long`. Works offline once installed on your iPhone.

## How it works

- `index.html` / `styles.css` — the full-screen button.
- `chirps-data.js` — the list of audio filenames in each folder (static
  hosting can't list a directory, so this file stands in for that).
- `app.js` — tells short vs. long press apart and plays the audio.
- `sw.js` + `manifest.webmanifest` — a service worker that caches the app
  and every chirp file on first load, so it keeps working with no signal,
  and a web app manifest so it can be added to your home screen.

If you add or remove files in `chirps/short` or `chirps/long`, regenerate
the file list before deploying:

```
powershell -ExecutionPolicy Bypass -File generate-manifest.ps1
```

Also bump `CACHE_VERSION` in `sw.js` (e.g. `v1` → `v2`) any time the audio
files or app files change, so the offline cache refreshes instead of
serving stale content forever.

## Deploy to GitHub Pages

1. Create a new GitHub repo and push this folder to it:

   ```
   git init
   git add .
   git commit -m "Chirps app"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Source**, pick the `main` branch and
   `/ (root)` folder, then save.

3. Wait a minute, then visit `https://<you>.github.io/<repo>/`.

## Install on iPhone (for offline use)

1. Open the GitHub Pages URL in **Safari** on your iPhone while online, and
   let the page fully load (this lets it cache everything).
2. Tap the Share icon → **Add to Home Screen**.
3. Open the app from your home screen icon from then on — no wifi/cell
   needed.

If you ever update the audio files or code, open the app once while online
so the service worker can refresh its cache.
