# Spicy Contributions

Turn GitHub contribution squares red on days you closed "bug" issues and make them blink when Actions failed.

## Install (Chrome/Edge)
1. `git clone` this folder or download as ZIP and extract.
2. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, choose the folder.
3. Click the extension's **Details → Extension options** and:
   - Paste a GitHub token (fine-grained or classic). Scopes:
     - Public repos only: no extra scopes, or `public_repo` is sufficient.
     - Private repos and Actions: add `repo` and `actions:read`.
   - Enter a comma-separated list of repos: `owner1/repo1, owner2/repo2`.
   - Set your bug label name (default `bug`).

## Install (Firefox)
- Visit `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → select `manifest.json`.

## How it works
- Background fetches:
  - Closed issues with your configured label in each repo (last 365 days).
  - Failed Actions runs in each repo (last 365 days).
- On GitHub profile pages, the content script:
  - Finds `svg.js-calendar-graph-svg rect[data-date]`.
  - Adds `.spicy-bug-day` (red fill) for bug days.
  - Adds `.spicy-fail-day` (blinking stroke) for failure days.
- A tiny legend is added near the calendar header.

## Notes / Limits
- Only repos you list are scanned (keeps it fast and intentional).
- Search API caps at 1000 results; that's more than enough for a year view.
- If a day has both bug and failure, you get red + blinking outline.
- If you see rate limits, add a token or narrow the repo list.

## Troubleshooting
- No changes? Ensure:
  - You're on `https://github.com/<your-username>` and the contribution graph is visible.
  - Options are saved with valid repos.
  - Token has `actions:read` if you expect failure data from private repos.
- Open DevTools → Console to see logs from the content script and network errors in the background (chrome://extensions → Inspect views).

## Icon Setup
The extension includes placeholder files for icons. To create proper PNG icons:
1. Use the provided `icons/icon.svg` as a base
2. Convert it to PNG at the required sizes: 16x16, 32x32, 48x48, and 128x128
3. Replace the placeholder `.png` files in the `icons/` directory

## Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker for GitHub API calls
- `contentScript.js` - Script that runs on GitHub pages
- `options.html` & `options.js` - Configuration page
- `icons/` - Extension icons (replace placeholders with actual PNGs)
- `README.md` - This file
