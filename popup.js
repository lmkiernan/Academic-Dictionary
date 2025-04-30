// popup.js

const keyView   = document.getElementById("keyView");
const mainView  = document.getElementById("mainView");
const apiKeyIn  = document.getElementById("apiKey");
const saveBtn   = document.getElementById("saveKey");
const statusDiv = document.getElementById("status");
const selDiv    = document.getElementById("selection");

// 1) On popup open: load stored API key & last selection
chrome.storage.local.get(["openAIKey", "lastSelection"], ({ openAIKey, lastSelection }) => {
  if (openAIKey) {
    // user already set a key → show main UI
    keyView.style.display  = "none";
    mainView.style.display = "block";
    apiKeyIn.value         = openAIKey;
    selDiv.textContent     = lastSelection || "(no text selected)";
  } else {
    // no key yet → show key entry UI
    keyView.style.display  = "block";
    mainView.style.display = "none";
  }
});

// 2) When they click “Save”
saveBtn.addEventListener("click", async () => {
  const key = apiKeyIn.value.trim();
  if (!key) {
    statusDiv.textContent = "🔑 Please enter a valid key.";
    statusDiv.style.color = "red";
    return;
  }

  await chrome.storage.local.set({ openAIKey: key });
  statusDiv.textContent = "✅ Key saved!";
  statusDiv.style.color = "green";

  // switch to main UI
  keyView.style.display  = "none";
  mainView.style.display = "block";

  // clear status after 2s
  setTimeout(() => (statusDiv.textContent = ""), 2000);
});