chrome.storage.local.get("lastSelection", ({ lastSelection }) => {
    const sel = lastSelection || "(no text selected)";
    document.getElementById("selection").textContent = sel;
  });