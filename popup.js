// popup.js

// 1) Cache DOM elements
const apiKeyInput = document.getElementById("apiKey");
const saveButton  = document.getElementById("saveKey");
const statusDiv   = document.getElementById("status");
const selDiv      = document.getElementById("selection");

// 2) On popup open: load stored API key and last selection
chrome.storage.local.get(["openAIKey", "lastSelection"], ({ openAIKey, lastSelection }) => {
  if (openAIKey) apiKeyInput.value = openAIKey;
  selDiv.textContent = lastSelection || "(no text selected)";
});

// 3) When user clicks “Save Key”
saveButton.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    statusDiv.textContent = "Please enter a valid key.";
    statusDiv.style.color = "red";
    return;
  }

  await chrome.storage.local.set({ openAIKey: key });
  statusDiv.textContent = "Key saved!";
  statusDiv.style.color = "green";

  // clear the message after 2s
  setTimeout(() => { statusDiv.textContent = ""; }, 2000);
});