# 🌶️ Spicy Contributions

Turn GitHub contribution squares **red** on days you closed "bug" issues and make them **blink** when Actions failed. A Chrome extension that makes your GitHub contribution graph more dynamic and meaningful!

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)](https://chrome.google.com/webstore)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/netn10/Spicy-Contributions)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

### 🔴 Bug Detection
- **Red pulsing squares** when commits contain bug-related keywords
- Detects keywords: `bug`, `fix`, `hotfix`, `patch`, `issue`, `crash`, `error`
- Visual warning with bouncing animation and tooltips

### ⚠️ Test Failure Blinking
- **Blinking yellow squares** when commits contain test-related issues
- Detects keywords: `test`, `spec`, `fail`, `broken`, `ci`, `travis`, `github-actions`
- Spinning warning animation for attention

### 🎯 Smart Features
- **Auto-detection**: Automatically detects the current repository you're viewing
- **Smart caching**: Efficiently caches API responses to avoid rate limits
- **Fallback methods**: Uses alternative API endpoints when search API is rate-limited
- **Real-time updates**: Updates contribution graph as you navigate GitHub
- **Auto-refresh**: Optionally refreshes data every 5 minutes

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** in the top right
4. Click **Load unpacked** and select the extension folder
5. The extension will appear in your extensions list

### Configuration

1. Click the extension icon or go to **Extension options**
2. Enter your GitHub Personal Access Token (see setup below)
3. Configure your preferences:
   - ✅ Enable bug detection
   - ✅ Enable test failure blinking
   - ✅ Enable auto-refresh (optional)
4. Click **Save Settings**

## 🔑 GitHub Token Setup

**Required to fix 403 Forbidden errors and access commit data.**

### Option 1: Classic Personal Access Token (Recommended)

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a descriptive name like "Spicy Contributions"
4. Set expiration (recommended: 90 days or custom)
5. Select scopes:
   - **Public repos only**: No additional scopes needed
   - **Private repos**: Check `repo` (full control of private repositories)
   - **GitHub Actions**: Check `actions:read` (to see failed workflow runs)
6. Click **Generate token**
7. Copy the token (starts with `ghp_`) and paste it in the extension options

### Option 2: Fine-grained Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Click **Generate new token**
3. Set repository access to "Only select repositories" and choose the repos you want to track
4. Set permissions:
   - **Repository permissions**:
     - `Issues`: Read access
     - `Actions`: Read access (for CI failures)
5. Click **Generate token**
6. Copy the token and paste it in the extension options

## 🧪 Testing Your Setup

### Method 1: Extension Options
1. Go to the extension options page
2. Click **Test Connection** to verify your token works
3. Check for success/error messages

### Method 2: Test Page
Open `test-token.html` in your browser for detailed testing:
- Test basic token authentication
- Test search API access
- Get detailed error messages

## 🔧 How It Works

The extension intelligently analyzes your GitHub activity:

1. **Auto-detection**: Detects when you're on a GitHub profile or repository page
2. **Data fetching**: Uses GitHub API to fetch commit data for each contribution date
3. **Keyword analysis**: Scans commit messages for bug and test-related keywords
4. **Visual effects**: Applies dynamic styling to contribution squares:
   - Red background with pulse animation for bug commits
   - Blinking animation for test failure commits
   - Hover tooltips with detailed information

### API Endpoints Used

- **Search API**: `https://api.github.com/search/commits` (primary method)
- **Repository API**: `https://api.github.com/repos/{owner}/{repo}/commits` (fallback)
- **Rate Limit API**: `https://api.github.com/rate_limit` (monitoring)

## 🛠️ Troubleshooting

### 403 Forbidden Errors

If you see errors like:
```
GET https://api.github.com/search/commits?q=author:username+committer-date:2024-XX-XX 403 (Forbidden)
```

**Solution**: Configure a valid GitHub Personal Access Token:
1. Follow the token setup instructions above
2. Ensure your token has the correct permissions
3. Test the connection in the extension options

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Invalid token" error** | Check that you copied the entire token correctly, ensure it hasn't expired |
| **"Token lacks permissions" error** | Make sure your token has `public_repo` scope (or `repo` for private repos) |
| **No visual effects visible** | Verify features are enabled in options, check that commits contain detected keywords |
| **Rate limiting** | The extension automatically falls back to alternative methods, check console for warnings |
| **Extension not working** | Ensure you're on a GitHub profile page, try refreshing the page |

### Debug Mode

Open Chrome DevTools → Console to see detailed logs:
- Network errors and API responses
- Rate limit information
- Extension initialization status
- Error messages and warnings

## 🎨 Customization

### Adding Custom Keywords

Edit `contentScript.js` to modify keyword detection:

```javascript
this.bugKeywords = ['bug', 'fix', 'hotfix', 'patch', 'issue', 'crash', 'error'];
this.testKeywords = ['test', 'spec', 'fail', 'broken', 'ci', 'travis', 'github-actions'];
```

### Styling Customization

Modify `styles.css` to customize visual effects:

```css
.spicy-bug {
  background-color: #dc3545 !important;
  animation: spicy-bug-pulse 2s infinite;
}

.spicy-test-fail {
  animation: spicy-blink 1s infinite;
}
```

## 📁 Project Structure

```
spicy-contributes/
├── manifest.json          # Extension configuration
├── contentScript.js       # Main content script (runs on GitHub pages)
├── background.js          # Service worker for API calls
├── options.html           # Configuration page
├── options.js             # Options page logic
├── styles.css             # Custom styles and animations
├── test-token.html        # Token testing utility
├── README.md              # This file
└── icons/                 # Extension icons
    ├── icon.svg           # Source icon
    ├── icon16.png         # 16x16 icon
    ├── icon32.png         # 32x32 icon
    ├── icon48.png         # 48x48 icon
    └── icon128.png        # 128x128 icon
```

## 🔒 Privacy & Security

- **Local storage**: Your GitHub token is stored locally in Chrome's sync storage
- **No external servers**: All API calls go directly to GitHub's official API
- **Minimal permissions**: Only requests necessary permissions for GitHub access
- **Token security**: You can revoke the token at any time from GitHub settings
- **Data handling**: No personal data is collected or transmitted

## 🚀 Development

### Local Development

1. Clone the repository
2. Make your changes
3. Go to `chrome://extensions/`
4. Click the refresh icon on the extension card
5. Reload GitHub pages to see changes

### Building for Distribution

1. Ensure all files are properly configured
2. Create a ZIP file of the extension folder
3. Submit to Chrome Web Store (if publishing)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

- GitHub for providing the excellent API
- Chrome Extensions team for the platform
- All contributors and users of this extension

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Include browser version and error messages

---

**Make your GitHub profile spicy! 🌶️🔥**

*Turn those boring green squares into a dynamic story of your coding journey!*
