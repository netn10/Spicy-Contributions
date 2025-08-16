// Runs on GitHub pages; when on a profile, decorates the contribution graph.

const STYLE_ID = "spicy-contrib-style";

injectStyles();

const isProfile = /^\/[^/]+\/?$/.test(location.pathname);
const isRepoPage = /^\/[^/]+\/[^/]+/.test(location.pathname);

if (isProfile || isRepoPage) {
  decorateWhenReady();
} else {
  // Also handle embedded graphs on org or repo insights pages if present later
  const obs = new MutationObserver(debounce(decorateIfGraphFound, 250));
  obs.observe(document.documentElement, { childList: true, subtree: true });
}

function decorateWhenReady() {
  // GitHub lazy-loads the calendar; wait for rects
  const tryDecorate = () => {
    const rects = queryCalendarRects();
    if (rects.length) {
      requestDataAndDecorate();
      return true;
    }
    return false;
  };

  if (!tryDecorate()) {
    const obs = new MutationObserver(() => { if (tryDecorate()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
}

function decorateIfGraphFound() {
  const rects = queryCalendarRects();
  if (rects.length) requestDataAndDecorate();
}

function queryCalendarRects() {
  // Matches profile contribution calendar squares
  return document.querySelectorAll('svg.js-calendar-graph-svg rect[data-date]');
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
    /* red tint for bug days (overrides GitHub SVG fill) */
    .spicy-bug-day { fill: #cc0000 !important; }

    /* blinking outline for failure days */
    .spicy-fail-day {
      stroke: currentColor !important;
      stroke-width: 2 !important;
      animation: spicy-blink 1.2s step-start 0s infinite;
    }

    @keyframes spicy-blink {
      50% { opacity: 0.35; }
    }

    /* legend */
    .spicy-legend {
      display: inline-flex; align-items: center; gap: 8px; margin-left: 12px; font-size: 12px;
    }
    .spicy-swatch { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
    .spicy-swatch.bug { background: #cc0000; }
    .spicy-swatch.fail { background: transparent; outline: 2px solid currentColor; animation: spicy-blink 1.2s step-start 0s infinite; }
  `;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  document.documentElement.appendChild(style);
}

function requestDataAndDecorate() {
  // Get current repository from the page
  const currentRepo = getCurrentRepository();
  if (!currentRepo) {
    console.warn("Spicy Contributions: Could not detect current repository");
    return;
  }

  chrome.runtime.sendMessage({ 
    type: "FETCH_DATES", 
    currentRepo: currentRepo 
  }, resp => {
    if (!resp?.ok) {
      // Optionally surface a small warning near the calendar
      console.warn("Spicy Contributions:", resp?.error || "unknown error");
      return;
    }
    const bugSet = new Set(resp.bugDates || []);
    const failSet = new Set(resp.failDates || []);
    applyDecorations(bugSet, failSet);
  });
}

function getCurrentRepository() {
  // Try to get repo from various page elements
  const repoElement = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]');
  if (repoElement) {
    return repoElement.getAttribute('content');
  }

  // Fallback: try to parse from URL
  const pathParts = location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    const owner = pathParts[0];
    const repo = pathParts[1];
    return `${owner}/${repo}`;
  }

  return null;
}

function applyDecorations(bugDates, failDates) {
  const rects = queryCalendarRects();
  let bugCount = 0, failCount = 0;

  rects.forEach(rect => {
    const date = rect.getAttribute("data-date"); // YYYY-MM-DD
    let touched = false;

    if (bugDates.has(date)) {
      rect.classList.add("spicy-bug-day");
      touched = true;
      bugCount++;
    }

    if (failDates.has(date)) {
      rect.classList.add("spicy-fail-day");
      touched = true;
      failCount++;
    }

    if (!touched) {
      rect.classList.remove("spicy-bug-day", "spicy-fail-day");
    }
  });

  attachLegend(bugCount, failCount);
}

function attachLegend(bugCount, failCount) {
  // Add an inline legend next to "Contribution activity" heading (if present)
  const heading = document.querySelector('h2:has(svg.js-calendar-graph-svg), div.js-yearly-contributions h2, div.js-yearly-contributions h2.h3');
  const container = document.querySelector('div.js-yearly-contributions, div.position-relative');

  // Fallback target
  const target = heading || container;
  if (!target) return;

  let legend = document.getElementById("spicy-legend");
  if (!legend) {
    legend = document.createElement("span");
    legend.id = "spicy-legend";
    legend.className = "spicy-legend";
    legend.innerHTML = `
      <span class="spicy-swatch bug" title="Closed issues with bug label"></span> <span>Shipped bugs</span>
      <span class="spicy-swatch fail" title="Failed workflow runs"></span> <span>CI failures</span>
    `;
    target.appendChild(legend);
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}
