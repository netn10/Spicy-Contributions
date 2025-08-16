const $ = s => document.querySelector(s);

document.addEventListener("DOMContentLoaded", async () => {
  chrome.storage.sync.get({ token: "", reposRaw: "", bugLabel: "bug" }, ({ token, reposRaw, bugLabel }) => {
    $("#token").value = token;
    $("#repos").value = reposRaw;
    $("#bugLabel").value = bugLabel || "bug";
  });

  $("#save").addEventListener("click", async () => {
    const token = $("#token").value.trim();
    const reposRaw = $("#repos").value.trim();
    const bugLabel = $("#bugLabel").value.trim() || "bug";
    await chrome.storage.sync.set({ token, reposRaw, bugLabel });
    setStatus("Saved.");
  });

  $("#test").addEventListener("click", async () => {
    setStatus("Fetching…");
    chrome.runtime.sendMessage({ type: "FETCH_DATES" }, resp => {
      if (!resp?.ok) {
        setStatus(`Error: ${resp?.error || "unknown"}`);
      } else {
        setStatus(`OK: ${resp.bugDates.length} bug days, ${resp.failDates.length} failure days.`);
      }
    });
  });
});

function setStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 5000);
}
