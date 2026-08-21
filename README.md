# Crumb — Sourdough Starter Diary

Crumb is a compact, single-page diary for tracking sourdough starter feedings. It is built with plain HTML, CSS, and JavaScript, with no dependencies or backend.

## Features

- Maintain multiple named starters, such as **Doughlores** and **Yeastie Boys**.
- Record the feeding date and time, starter/flour/water ratio, activity level, and an optional note.
- See the elapsed time since each starter's latest feeding at a glance.
- Browse feedings in reverse chronological order and filter them by starter.
- Scroll long feeding histories inside the diary without scrolling the whole page.
- Switch between the feeding form and diary on mobile.
- Scroll the mobile feeding form on short screens while keeping its scrollbar hidden.
- Add and remove starters or individual feeding entries.
- Persist all starter and feeding data across refreshes with `localStorage`.
- Handle invalid saved data and unavailable browser storage gracefully.

## Run locally

No installation or build step is required. Open `index.html` directly, or serve the directory with any static file server:

```sh
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Tests

Run the included Node.js checks with:

```sh
node test.js
```

The checks cover elapsed-time labels, reverse chronological sorting, and saved-state normalization.

## Data storage

Crumb stores data in the browser under the `crumb-diary-v1` localStorage key. Data stays on the current browser and device. Removing site data will clear the diary.

## Project structure

```text
index.html   Page structure and accessible controls
style.css    Responsive layout and visual design
app.js       State, persistence, validation, and rendering
test.js      Lightweight Node.js checks
brief/       Original challenge requirements
```

The three files shipped to the browser (`index.html`, `style.css`, and `app.js`) total **24,953 bytes**, remaining below the challenge's 25 KB limit.
