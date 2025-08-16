document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get([
    'githubToken',
    'enableBugDetection',
    'enableTestBlinking',
    'enableAutoRefresh'
  ], function(items) {
    document.getElementById('token').value = items.githubToken || '';
    document.getElementById('enableBugDetection').checked = items.enableBugDetection !== false;
    document.getElementById('enableTestBlinking').checked = items.enableTestBlinking !== false;
    document.getElementById('enableAutoRefresh').checked = items.enableAutoRefresh !== false;
  });

  // Save settings
  document.getElementById('save').addEventListener('click', function() {
    const settings = {
      githubToken: document.getElementById('token').value,
      enableBugDetection: document.getElementById('enableBugDetection').checked,
      enableTestBlinking: document.getElementById('enableTestBlinking').checked,
      enableAutoRefresh: document.getElementById('enableAutoRefresh').checked
    };

    chrome.storage.sync.set(settings, function() {
      showStatus('Settings saved successfully!', 'success');
    });
  });

  // Test GitHub connection
  document.getElementById('test').addEventListener('click', async function() {
    const token = document.getElementById('token').value;
    if (!token) {
      showStatus('Please enter a GitHub token first', 'error');
      return;
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Spicy-Contributes-Extension'
        }
      });

      if (response.ok) {
        const user = await response.json();
        showStatus(`✅ Connected successfully! Logged in as ${user.login}`, 'success');
      } else if (response.status === 401) {
        showStatus('❌ Invalid token. Please check your GitHub Personal Access Token.', 'error');
      } else if (response.status === 403) {
        showStatus('❌ Token lacks required permissions. Please ensure your token has the necessary scopes.', 'error');
      } else {
        showStatus(`❌ Connection failed with status ${response.status}. Please check your token.`, 'error');
      }
    } catch (error) {
      showStatus('❌ Connection failed: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 5000);
  }
});
