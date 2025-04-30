// popup.js

// Elements
const keyView   = document.getElementById("keyView");
const mainView  = document.getElementById("mainView");
const apiKeyIn  = document.getElementById("apiKey");
const saveBtn   = document.getElementById("saveKey");
const statusDiv = document.getElementById("status");
const selDiv    = document.getElementById("selection");
const defDiv    = document.getElementById("definition");

// --- helper to call OpenAI and fill #definition ---
async function generateDefinition(text) {
  defDiv.textContent = "⏳ Defining…";
  const { openAIKey } = await chrome.storage.local.get("openAIKey");
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
            content: `What does the following text mean in an academic context?\n\n"${text}"`
          }
        ],
        temperature: 0.2
      })
    });
    if (!resp.ok) throw await resp.json();
    const { choices } = await resp.json();
    defDiv.textContent = choices[0].message.content.trim();
  } catch (err) {
    defDiv.textContent = `❗Error: ${err.error?.message || err.message}`;
  }
}

// --- on popup open: decide which view & maybe auto-define ---
chrome.storage.local.get(
  ["openAIKey", "lastSelection"],
  ({ openAIKey, lastSelection }) => {
    if (openAIKey) {
      // show main view
      keyView.style.display  = "none";
      mainView.style.display = "block";
      selDiv.textContent     = lastSelection || "(no text selected)";

      // **AUTO-RUN** only if there's some selected text
      if (lastSelection) {
        generateDefinition(lastSelection);
      } else {
        defDiv.textContent = "(no text selected)";
      }
    } else {
      // ask for API key
      keyView.style.display  = "block";
      mainView.style.display = "none";
    }
  }
);

// --- key-save logic unchanged ---
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