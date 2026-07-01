# Wedding Site

A static, multilingual wedding website (English, French, Czech) built with plain HTML templates and Handlebars.

## How it works

- `src/pages/*.html` — page templates (`index.html`, `rsvp.html`), written with Handlebars syntax.
- `src/locales/*.json` — one file per language (`en.json`, `fr.json`, `cs.json`) supplying the text each template renders.
- `src/styles.css` — shared stylesheet, copied as-is into the output.
- `build.js` — the build script. For every locale, it compiles every page template against that locale's JSON and writes the result to `dist/<locale>/<page>.html`. It also copies `styles.css`, copies `src/pages/_redirects` (used by Netlify), and writes a `dist/index.html` that redirects `/` to `/en/`.

There is no bundler step — `build.js` is the entire build pipeline for both production builds and local development. Vite is only used in dev mode as a static file server for whatever `build.js` last generated into `dist/`.

## Adding a language

1. Add a `src/locales/<code>.json` file with the same keys as `en.json`.
2. Add `{ code: "<code>", label: "<Display Name>" }` to the `locales` array in `build.js`.

## Adding a page

Add a new `.html` file to `src/pages/`. It will automatically be compiled for every locale into `dist/<locale>/<file>.html`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Runs `build.js` once, generating the full site into `dist/`. This is the production build. |
| `npm run dev` | Runs `build.js` on startup and again on every change under `src/` (via `nodemon`), while Vite serves the `dist/` folder with live-reload at `http://localhost:5173`. |
| `npm run preview` | Serves the current contents of `dist/` without rebuilding (useful for sanity-checking a production build). |

`npm run dev` runs two things in parallel (via `npm-run-all`):
- `watch` — `nodemon` watches `src/**/*.{html,json,css}` and re-runs `node build.js` on any change.
- `serve` — `vite` serves `dist/` and reloads the browser once new files land.

## Deployment

The build output in `dist/` is a plain static site — deploy it as-is. `dist/_redirects` is included for Netlify so that `/` redirects to `/en/`; other static hosts can use `dist/index.html`, which does the same redirect via a meta refresh.
