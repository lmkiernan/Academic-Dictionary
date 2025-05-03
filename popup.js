const PROVIDERS = { OPENAI: 'openai', GEMINI: 'gemini' };
let provider;

// Show or hide sections
function showSection(id) {
  document.querySelectorAll('#openaiInput, #geminiInput, #mainView')
    .forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([
    'provider', 'openAIKey', 'geminiKey', 'lastSelection', 'myNotes'
  ], data => {
    provider = data.provider;
    if (!provider) {
      document.getElementById('useOpenAI').onclick = () => showSection('openaiInput');
      document.getElementById('useGemini').onclick = () => showSection('geminiInput');

      document.getElementById('saveOpenAIKey').onclick = () => {
        const key = document.getElementById('openAIKeyInput').value.trim();
        if (key.startsWith('sk-')) {
          chrome.storage.local.set({ provider: PROVIDERS.OPENAI, openAIKey: key }, initMainView);
        } else {
          alert('Invalid OpenAI key');
        }
      };

      document.getElementById('saveGeminiKey').onclick = () => {
        const key = document.getElementById('geminiKeyInput').value.trim();
        if (key) {
          chrome.storage.local.set({ provider: PROVIDERS.GEMINI, geminiKey: key }, initMainView);
        } else {
          alert('Invalid Gemini key');
        }
      };
    } else {
      initMainView(data);
    }
  });
});

function initMainView(data = {}) {
  document.getElementById('keyView').classList.add('hidden');
  document.getElementById('mainView').classList.remove('hidden');

  document.getElementById('selection').textContent = data.lastSelection || '(no text selected)';
  renderNotes(data.myNotes || []);

  fetchDefinition(data.lastSelection);

  document.getElementById('simplerBtn').onclick = () => fetchDefinition(data.lastSelection, true);
  document.getElementById('saveNote').onclick = saveCurrentNote;
  document.getElementById('aboutBtn').onclick = () => chrome.tabs.create({ url: '<YOUR_REPO_URL>' });
}

async function fetchDefinition(text, simpler = false) {
  const defEl = document.getElementById('definition');
  defEl.textContent = '(loading...)';
  if (provider === PROVIDERS.OPENAI) {
    const { openAIKey } = await chrome.storage.local.get('openAIKey');
    defEl.textContent = await callOpenAI(openAIKey, text, simpler);
  } else {
    const { geminiKey } = await chrome.storage.local.get('geminiKey');
    defEl.textContent = await callGemini(geminiKey, text, simpler);
  }
}

async function callOpenAI(key, text, simpler) {
  const prompt = simpler
    ? `Explain simply with an example: "${text}"`
    : `Define academically: "${text}"`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const json = await response.json();
  return json.choices?.[0]?.message?.content || '(error)';
}

async function callGemini(key, text, simpler) {
  const prompt = simpler
    ? `Explain simply with an example: "${text}"`
    : `Define academically: "${text}"`;

  // Build the URL with your Gemini key as a query parameter
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;

  // Construct the request body in the "generateContent" shape
  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  // The response returns `candidates`, pick the first
  return json.candidates?.[0]?.content || '(error)';
}

function renderNotes(notes) {
  const list = document.getElementById('notesList');
  list.innerHTML = '';
  notes.forEach(note => {
    const div = document.createElement('div');
    div.innerHTML = `<em>${new Date(note.timestamp).toLocaleString()}</em><br/>
                     <strong>${note.text}</strong>
                     <p>${note.def}</p><hr/>`;
    list.appendChild(div);
  });
}

function saveCurrentNote() {
  const text = document.getElementById('selection').textContent;
  const def = document.getElementById('definition').textContent;
  chrome.storage.local.get('myNotes', data => {
    const notes = data.myNotes || [];
    notes.unshift({ text, def, timestamp: new Date().toISOString() });
    if (notes.length > 10) notes.pop();
    chrome.storage.local.set({ myNotes: notes }, () => renderNotes(notes));
  });
}
