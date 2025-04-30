// popup.js

// DOM elements
const keyView   = document.getElementById("keyView");
const mainView  = document.getElementById("mainView");
const apiKeyIn  = document.getElementById("apiKey");
const saveBtn   = document.getElementById("saveKey");
const statusDiv = document.getElementById("status");
const selDiv    = document.getElementById("selection");
const defDiv    = document.getElementById("definition");
const saveNoteBtn = document.getElementById("saveNote");
const notesList   = document.getElementById("notesList");

// Helper: call OpenAI and fill #definition
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
          { role: "user", content: `What does the following text mean in an academic context?\n\n"${text}"` }
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

// Render up to 10 notes
function renderNotes(notes) {
  notesList.innerHTML = "";
  notes.forEach(({ text, def, ts }) => {
    const item = document.createElement("div");
    item.className = "note-item";
    item.innerHTML = `
      <strong>${text}</strong>
      <time>${new Date(ts).toLocaleString()}</time>
      <p>${def}</p>
    `;
    notesList.append(item);
  });
}

// On popup open: decide which view, auto-define, and load notes
chrome.storage.local.get([
  "openAIKey",
  "lastSelection",
  "myNotes"
], ({ openAIKey, lastSelection, myNotes = [] }) => {
  if (openAIKey) {
    keyView.style.display  = "none";
    mainView.style.display = "block";
    selDiv.textContent     = lastSelection || "(no text selected)";

    if (lastSelection) {
      generateDefinition(lastSelection);
    } else {
      defDiv.textContent = "(no text selected)";
    }

    renderNotes(myNotes);
  } else {
    keyView.style.display  = "block";
    mainView.style.display = "none";
  }
});

// Save API key
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

// Save note (keep last 10)
saveNoteBtn.addEventListener("click", async () => {
  const text = selDiv.textContent;
  const def  = defDiv.textContent;
  if (!text || text === "(no text selected)" || !def) return;

  const { myNotes = [] } = await chrome.storage.local.get("myNotes");
  myNotes.unshift({ text, def, ts: Date.now() });
  const trimmed = myNotes.slice(0, 10);
  await chrome.storage.local.set({ myNotes: trimmed });
  renderNotes(trimmed);
});
