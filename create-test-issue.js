// Script to create a test issue for Spicy Contributions extension testing
// Usage: node create-test-issue.js YOUR_GITHUB_TOKEN

const https = require('https');

const token = process.argv[2];
if (!token) {
  console.log('Usage: node create-test-issue.js YOUR_GITHUB_TOKEN');
  console.log('Get a token from: https://github.com/settings/tokens');
  process.exit(1);
}

const issueData = {
  title: 'Test Bug for Spicy Contributions Extension',
  body: `This is a test bug issue to verify the Spicy Contributions extension works correctly.

## Test Steps:
- [ ] Create this issue with "bug" label
- [ ] Close this issue
- [ ] Check if contribution square turns red on the closed date
- [ ] Check if the extension shows the red square on your GitHub profile

## Extension Features to Test:
- Red squares for closed bug issues
- Blinking squares for CI failures
- Auto-detection of current repository

This issue was created automatically for testing purposes.`,
  labels: ['bug']
};

const postData = JSON.stringify(issueData);

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/repos/netn10/Spicy-Contributions/issues',
  method: 'POST',
  headers: {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Spicy-Contributions-Test',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 201) {
      const issue = JSON.parse(data);
      console.log('✅ Test issue created successfully!');
      console.log(`📝 Issue URL: ${issue.html_url}`);
      console.log(`🔢 Issue Number: #${issue.number}`);
      console.log('\n📋 Next steps:');
      console.log('1. Visit the issue URL above');
      console.log('2. Close the issue (click "Close issue" button)');
      console.log('3. Go to your GitHub profile page');
      console.log('4. Check if the contribution square for today turns red');
      console.log('5. Make sure your Spicy Contributions extension is installed and configured');
    } else {
      console.error('❌ Failed to create issue:');
      console.error(`Status: ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();
