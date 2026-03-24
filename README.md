# Music-speed-controller

This is a Tampermonkey userscript that adds a floating speed control widget to Spotify's web player. Pick from presets or type in whatever speed you want.

## Setup

You'll need to install [Tampermonkey](https://www.tampermonkey.net/). It's a free browser extension that lets you run custom scripts on any site.

1. Install Tampermonkey for [Brave/Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/tampermonkey/)
2. Go to `brave://extensions` or `chrome://extensions` and turn on developer mode
3. Click here to install: [spotify.user.js](https://raw.githubusercontent.com/ViSaLrOxX/music-speed-controller/main/spotify.user.js)

Then just open Spotify in your browser and the widget will appear in the bottom right corner.

## What it does

- Preset speeds: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x, 3x, 4x
- Custom speed input if none of the presets work for you
- Keyboard shortcuts: `[` to slow down, `]` to speed up
- Speed stays the same when the next track plays
- Remembers your preferred speed between sessions
- Can be minimised to a small pill when you don't need it

## Platforms

| Platform | Status |
|---|---|
| Spotify | working |
