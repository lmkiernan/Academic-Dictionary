// popup.js

const keyView    = document.getElementById("keyView");
const mainView   = document.getElementById("mainView");
const apiKeyIn   = document.getElementById("apiKey");
const saveBtn    = document.getElementById("saveKey");
const statusDiv  = document.getElementById("status");
const selDiv     = document.getElementById("selection");
const defineBtn  = document.getElementById("defineBtn");
const defDiv     = document.getElementById("definition");

// 1) On popup open: load stored API key & last selection
chrome.storage.local.get(
  ["openAIKey", "lastSelection"],
  ({ openAIKey, lastSelection }) => {
    if (openAIKey) {
      keyView.style.display  = "none";
      mainView.style.display = "block";
      apiKeyIn.value         = openAIKey;
      selDiv.textContent     = lastSelection || "(no text selected)";
    } else {
      keyView.style.display  = "block";
      mainView.style.display = "none";
    }
  }
);

// 2) Save key logic (unchanged)
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
  keyView.style.display  = "none";
  mainView.style.display = "block";
  setTimeout(() => (statusDiv.textContent = ""), 2000);
});

// 3) Define button → call OpenAI
defineBtn.addEventListener("click", async () => {
  defDiv.textContent = "⏳ Thinking…";
  // grab both key and selection
  const { openAIKey, lastSelection } = await chrome.storage.local.get(
    ["openAIKey", "lastSelection"]
  );
  if (!lastSelection) {
    defDiv.textContent = "⚠️ No text selected to define.";
    return;
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an academic assistant." },
          {
            role: "user",
            content: `What does the following text mean in an academic context?\n\n"${lastSelection}"`
          }
        ],
        temperature: 0.2
      })
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || resp.statusText);
    }

    const { choices } = await resp.json();
    defDiv.textContent = choices[0].message.content.trim();
  } catch (e) {
    defDiv.textContent = `❗Error: ${e.message}`;
  }
});