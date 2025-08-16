// Spicy Contributes - Dynamic GitHub Contribution Graph
class SpicyContributes {
  constructor() {
    this.settings = {};
    this.contributions = new Map();
    this.commitCache = new Map(); // Cache for API responses
    this.bugKeywords = ['bug', 'fix', 'hotfix', 'patch', 'issue', 'crash', 'error'];
    this.testKeywords = ['test', 'spec', 'fail', 'broken', 'ci', 'travis', 'github-actions'];
    this.observer = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupObserver();
    this.injectStyles();
    this.processExistingContributions();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'githubToken',
        'enableBugDetection',
        'enableTestBlinking',
        'enableAutoRefresh'
      ], (items) => {
        this.settings = items;
        resolve();
      });
    });
  }

  setupObserver() {
    // Watch for dynamic content changes (GitHub uses SPA navigation)
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processContributionGraph(node);
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .spicy-contribution {
        transition: all 0.3s ease;
      }
      
      .spicy-bug {
        background-color: #dc3545 !important;
        box-shadow: 0 0 10px rgba(220, 53, 69, 0.5);
        animation: spicy-bug-pulse 2s infinite;
      }
      
      .spicy-test-fail {
        animation: spicy-blink 1s infinite;
      }
      
      @keyframes spicy-bug-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      @keyframes spicy-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }
      
      .spicy-tooltip {
        position: absolute;
        background: #24292e;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
    `;
    document.head.appendChild(style);
  }

  processExistingContributions() {
    this.processContributionGraph(document.body);
  }

  processContributionGraph(container) {
    // Find contribution graph cells
    const cells = container.querySelectorAll('.ContributionCalendar-day, [data-date]');
    
    cells.forEach(cell => {
      if (cell.dataset.date && !cell.classList.contains('spicy-processed')) {
        this.processContributionCell(cell);
      }
    });
  }

  async processContributionCell(cell) {
    const date = cell.dataset.date;
    if (!date || cell.classList.contains('spicy-processed')) return;

    cell.classList.add('spicy-processed');
    
    // Get contribution data for this date
    const contributionData = await this.getContributionData(date);
    
    if (contributionData) {
      this.applySpicyEffects(cell, contributionData);
    }
  }

  async getContributionData(date) {
    if (!this.settings.githubToken) return null;

    try {
      // Get username from current page
      const username = this.getCurrentUsername();
      if (!username) return null;

      // Fetch commits for this date
      const commits = await this.fetchCommits(username, date);
      
      return {
        date,
        commits,
        hasBugs: this.detectBugs(commits),
        hasTestFailures: this.detectTestFailures(commits)
      };
    } catch (error) {
      console.error('Error fetching contribution data:', error);
      return null;
    }
  }

  getCurrentUsername() {
    // Try multiple methods to get username
    let username = null;
    
    // Method 1: From URL
    const urlMatch = window.location.pathname.match(/^\/([^\/]+)/);
    if (urlMatch) {
      username = urlMatch[1];
      return username;
    }
    
    // Method 2: From meta tag
    const profileLink = document.querySelector('meta[property="og:url"]');
    if (profileLink) {
      const url = profileLink.getAttribute('content');
      const match = url.match(/github\.com\/([^\/]+)/);
      if (match) {
        username = match[1];
        return username;
      }
    }

    // Method 3: From page elements
    const usernameElement = document.querySelector('.p-nickname, .username, [data-testid="username"], .vcard-username');
    if (usernameElement) {
      username = usernameElement.textContent.trim();
      return username;
    }
    
    return null;
  }

  async fetchCommits(username, date) {
    try {
      // Format date properly for GitHub API
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      // Check cache first
      const cacheKey = `${username}-${formattedDate}`;
      if (this.commitCache.has(cacheKey)) {
        return this.commitCache.get(cacheKey);
      }
      
      // Check if we have a valid token
      if (!this.settings.githubToken || this.settings.githubToken.trim() === '') {
        console.warn('Spicy Contributes: No GitHub token configured. Please add a token in the extension options.');
        return [];
      }
      
      // Check rate limits first
      const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `token ${this.settings.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Spicy-Contributes-Extension'
        }
      });
      
      if (rateLimitResponse.ok) {
        const rateLimitData = await rateLimitResponse.json();
        const searchLimit = rateLimitData.resources.search;
        
        if (searchLimit.remaining === 0) {
          console.warn('Spicy Contributes: Search API rate limit exceeded, using alternative method');
          return await this.fetchCommitsAlternative(username, formattedDate);
        }
      }
      
      // Use search API with rate limit check
      const response = await fetch(
        `https://api.github.com/search/commits?q=author:${username}+committer-date:${formattedDate}`,
        {
          headers: {
            'Authorization': `token ${this.settings.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Spicy-Contributes-Extension'
          }
        }
      );

      if (!response.ok) {
        // Log the specific error for debugging
        console.warn(`Spicy Contributes: GitHub API error ${response.status}: ${response.statusText}`);
        
        // Check if it's authentication error
        if (response.status === 401) {
          console.error('Spicy Contributes: Invalid GitHub token. Please check your token in the extension options.');
          return [];
        }
        
        // Check if it's rate limiting or forbidden
        if (response.status === 403 || response.status === 429) {
          console.warn('Spicy Contributes: Rate limited or forbidden, using alternative method');
          return await this.fetchCommitsAlternative(username, formattedDate);
        }
        
        return [];
      }

      const data = await response.json();
      const commits = data.items || [];
      
      // Cache the result
      this.commitCache.set(cacheKey, commits);
      
      return commits;
    } catch (error) {
      console.error('Spicy Contributes: Error fetching commits:', error);
      return [];
    }
  }

  async fetchCommitsAlternative(username, date) {
    try {
      // Check if we have a valid token
      if (!this.settings.githubToken || this.settings.githubToken.trim() === '') {
        return [];
      }
      
      // Use a more efficient approach - get recent commits from user's repos
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
        {
          headers: {
            'Authorization': `token ${this.settings.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Spicy-Contributes-Extension'
          }
        }
      );

      if (!response.ok) {
        console.warn(`Spicy Contributes: Alternative method failed with status ${response.status}`);
        return [];
      }

      const repos = await response.json();
      const allCommits = [];
      
      // Get commits from recent repositories
      for (const repo of repos.slice(0, 3)) { // Limit to 3 most recent repos
        try {
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/commits?since=${date}T00:00:00Z&until=${date}T23:59:59Z&author=${username}`,
            {
              headers: {
                'Authorization': `token ${this.settings.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Spicy-Contributes-Extension'
              }
            }
          );
          
          if (commitsResponse.ok) {
            const repoCommits = await commitsResponse.json();
            allCommits.push(...repoCommits);
          } else {
            console.warn(`Spicy Contributes: Failed to fetch commits from ${repo.name}: ${commitsResponse.status}`);
          }
        } catch (error) {
          console.warn(`Spicy Contributes: Error fetching commits from ${repo.name}:`, error);
        }
      }

      // Cache the result using the same cache key format
      const cacheKey = `${username}-${date}`;
      this.commitCache.set(cacheKey, allCommits);
      
      return allCommits;
    } catch (error) {
      console.error('Spicy Contributes: Error in alternative fetch method:', error);
      return [];
    }
  }

  detectBugs(commits) {
    if (!this.settings.enableBugDetection) return false;

    return commits.some(commit => {
      const message = commit.commit.message.toLowerCase();
      return this.bugKeywords.some(keyword => message.includes(keyword));
    });
  }

  detectTestFailures(commits) {
    if (!this.settings.enableTestBlinking) return false;

    return commits.some(commit => {
      const message = commit.commit.message.toLowerCase();
      return this.testKeywords.some(keyword => message.includes(keyword));
    });
  }

  applySpicyEffects(cell, data) {
    const originalColor = cell.style.backgroundColor;
    
    if (data.hasBugs) {
      cell.classList.add('spicy-bug');
      this.addTooltip(cell, '🐛 Bug detected in this commit!');
    } else if (data.hasTestFailures) {
      cell.classList.add('spicy-test-fail');
      this.addTooltip(cell, '⚠️ Test failure detected!');
    }

    // Store original state for potential restoration
    cell.dataset.spicyOriginalColor = originalColor;
  }

  addTooltip(cell, message) {
    cell.addEventListener('mouseenter', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'spicy-tooltip';
      tooltip.textContent = message;
      
      const rect = cell.getBoundingClientRect();
      tooltip.style.left = rect.left + 'px';
      tooltip.style.top = (rect.top - 40) + 'px';
      
      document.body.appendChild(tooltip);
      cell.spicyTooltip = tooltip;
    });

    cell.addEventListener('mouseleave', () => {
      if (cell.spicyTooltip) {
        cell.spicyTooltip.remove();
        cell.spicyTooltip = null;
      }
    });
  }

  
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SpicyContributes();
  });
} else {
  new SpicyContributes();
}
