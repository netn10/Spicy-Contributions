// Background service worker (MV3). Fetches data from GitHub API and returns date maps.

const GITHUB_API = "https://api.github.com";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "FETCH_DATES") {
    (async () => {
      try {
        const cfg = await getConfig();
        if (!cfg.token) {
          sendResponse({ ok: false, error: "Missing GitHub token in options." });
          return;
        }

        // Use current repo if provided, otherwise fall back to configured repos
        let reposToCheck = [];
        if (msg.currentRepo) {
          reposToCheck = [msg.currentRepo];
        } else if (cfg.repos && cfg.repos.length > 0) {
          reposToCheck = cfg.repos;
        } else {
          sendResponse({ ok: false, error: "No repository detected on current page and no repositories configured in options." });
          return;
        }

        const sinceISO = oneYearAgoISO();
        const headers = cfg.token ? { Authorization: `Bearer ${cfg.token}`, Accept: "application/vnd.github+json" } : { Accept: "application/vnd.github+json" };

        const [bugDates, failDates] = await Promise.all([
          fetchBugDates(reposToCheck, cfg.bugLabel || "bug", sinceISO, headers),
          fetchFailureDates(reposToCheck, sinceISO, headers)
        ]);

        sendResponse({ ok: true, bugDates: Array.from(bugDates), failDates: Array.from(failDates) });
      } catch (e) {
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    // Return true to keep the message channel open for async response
    return true;
  }
});

function oneYearAgoISO() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 365);
  return d.toISOString();
}

async function getConfig() {
  return new Promise(resolve => {
    chrome.storage.sync.get(
      { token: "", reposRaw: "", bugLabel: "bug" },
      items => {
        const repos = (items.reposRaw || "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
          .map(normalizeRepo);
        resolve({ token: items.token.trim(), repos, bugLabel: (items.bugLabel || "bug").trim() });
      }
    );
  });
}

function normalizeRepo(s) {
  // Accept owner/repo or full https URL
  try {
    if (s.startsWith("http")) {
      const u = new URL(s);
      const [owner, repo] = u.pathname.split("/").filter(Boolean);
      if (owner && repo) return `${owner}/${repo}`;
    }
  } catch {}
  return s;
}

async function fetchBugDates(repos, bugLabel, sinceISO, headers) {
  const dates = new Set();
  for (const full of repos) {
    const [owner, repo] = full.split("/");
    if (!owner || !repo) continue;

    // Use Issues search to filter by label + state + repo + closed dates
    // Note: Search API caps at 1000 results; fine for visual overlay.
    const q = `repo:${owner}/${repo} is:issue label:"${bugLabel}" is:closed closed:>=${sinceISO}`;
    for await (const issue of paginatedSearchIssues(q, headers)) {
      if (issue.closed_at) {
        dates.add(issue.closed_at.slice(0, 10)); // YYYY-MM-DD
      }
    }
  }
  return dates;
}

async function* paginatedSearchIssues(query, headers) {
  // Search: /search/issues?q=...&per_page=100&page=1...
  for (let page = 1; page <= 10; page++) { // hard cap to avoid abuse
    const url = `${GITHUB_API}/search/issues?q=${encodeURIComponent(query)}&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Issue search failed (${res.status})`);
    const data = await res.json();
    if (!data.items || data.items.length === 0) break;
    for (const it of data.items) yield it;
    if (data.items.length < 100) break;
  }
}

async function fetchFailureDates(repos, sinceISO, headers) {
  const dates = new Set();
  for (const full of repos) {
    const [owner, repo] = full.split("/");
    if (!owner || !repo) continue;

    // List workflow runs with status=failed (GitHub calls it "failure")
    // Paginate a bit, filter by created_at >= since
    for (let page = 1; page <= 5; page++) {
      const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?status=failure&per_page=100&page=${page}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        // If Actions not enabled or repo private without scope, just skip
        if (res.status === 404 || res.status === 403) break;
        throw new Error(`Actions runs failed (${owner}/${repo} ${res.status})`);
      }
      const data = await res.json();
      const runs = data?.workflow_runs || [];
      if (runs.length === 0) break;

      for (const run of runs) {
        const d = new Date(run.created_at);
        if (isNaN(d)) continue;
        if (d.toISOString() >= sinceISO) {
          dates.add(run.created_at.slice(0, 10));
        }
      }
      if (runs.length < 100) break;
    }
  }
  return dates;
}
