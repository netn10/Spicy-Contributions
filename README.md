# Spicy Contributions

Turn GitHub contribution squares red on days you closed "bug" issues and make them blink when Actions failed.

## Install (Chrome/Edge)
1. `git clone` this folder or download as ZIP and extract.
2. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, choose the folder.
3. Click the extension's **Details → Extension options** and:
   - Paste a GitHub token (fine-grained or classic). Scopes:
     - Public repos only: no extra scopes, or `public_repo` is sufficient.
     - Private repos and Actions: add `repo` and `actions:read`.
   - Enter a comma-separated list of repos: `owner1/repo1, owner2/repo2` (optional - extension will auto-detect current repo).
   - Set your bug label name (default `bug`).

## Getting a GitHub Token

### Fine-grained Personal Access Token (Recommended)
1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a descriptive name like "Spicy Contributions"
4. Set expiration (recommended: 90 days or custom)
5. Select scopes:
   - **Public repos only**: No additional scopes needed
   - **Private repos**: Check `repo` (full control of private repositories)
   - **GitHub Actions**: Check `actions:read` (to see failed workflow runs)
6. Click **Generate token**
7. Copy the token (starts with `ghp_`) and paste it in the extension options

### Alternative: Fine-grained Personal Access Token
1. Go to [GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Click **Generate new token**
3. Set repository access to "Only select repositories" and choose the repos you want to track
4. Set permissions:
   - **Repository permissions**: 
     - `Issues`: Read access
     - `Actions`: Read access (for CI failures)
5. Click **Generate token**
6. Copy the token and paste it in the extension options

## Install (Firefox)
- Visit `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → select `manifest.json`.

## How it works
- **Auto-detection**: The extension automatically detects the current repository you're viewing on GitHub
- **Fallback**: If no repository is detected, it uses the repositories configured in options
- Background fetches:
  - Closed issues with your configured label in the detected repo (last 365 days).
  - Failed Actions runs in the detected repo (last 365 days).
- On GitHub profile and repository pages, the content script:
  - Finds `svg.js-calendar-graph-svg rect[data-date]`.
  - Adds `.spicy-bug-day` (red fill) for bug days.
  - Adds `.spicy-fail-day` (blinking stroke) for failure days.
- A tiny legend is added near the calendar header.

## Notes / Limits
- The extension automatically detects and tracks the repository you're currently viewing
- You can also configure a list of specific repositories in options as a fallback
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
