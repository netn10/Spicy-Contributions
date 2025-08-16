// Background service worker for Spicy Contributes
chrome.runtime.onInstalled.addListener(() => {
  console.log('🌶️ Spicy Contributes installed!');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_GITHUB_DATA') {
    handleGitHubRequest(request.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleGitHubRequest(data) {
  const { url, token } = data;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Spicy-Contributes-Extension'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('GitHub API request failed:', error);
    return { success: false, error: error.message };
  }
}

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Notify content scripts of settings changes
    chrome.tabs.query({ url: 'https://github.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          changes: changes
        }).catch(() => {
          // Tab might not be ready, ignore errors
        });
      });
    });
  }
});

// Set up periodic refresh if enabled
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'spicy-refresh') {
      refreshContributions();
    }
  });
}

async function refreshContributions() {
  chrome.storage.sync.get(['enableAutoRefresh'], (items) => {
    if (items.enableAutoRefresh) {
      chrome.tabs.query({ url: 'https://github.com/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'REFRESH_CONTRIBUTIONS'
          }).catch(() => {
            // Tab might not be ready, ignore errors
          });
        });
      });
    }
  });
}

// Set up alarm for auto-refresh
chrome.storage.sync.get(['enableAutoRefresh'], (items) => {
  if (items.enableAutoRefresh && chrome.alarms) {
    chrome.alarms.create('spicy-refresh', { periodInMinutes: 5 });
  }
});
