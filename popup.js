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

function formatDefinition(raw) {
  if (!raw) return '';

  // 1. Escape any accidental HTML
  let escaped = raw
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  // 2. Bold: **text**
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 3. Build lines
  const lines = escaped.split('\n');
  let inList = false;
  const out = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      // blank line → close any open list
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.startsWith('* ')) {
      // list item
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${line.slice(2)}</li>`);
    } else {
      // normal paragraph
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(`<p>${line}</p>`);
    }
  }
  if (inList) out.push('</ul>');

  return out.join('');
}

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
  defEl.innerHTML = '(loading…)';   // use innerHTML here too

  let raw;
  if (provider === PROVIDERS.OPENAI) {
    const { openAIKey } = await chrome.storage.local.get('openAIKey');
    raw = await callOpenAI(openAIKey, text, simpler);
  } else {
    const { geminiKey } = await chrome.storage.local.get('geminiKey');
    raw = await callGemini(geminiKey, text, simpler);
  }

  // instead of textContent, render formatted HTML:
  defEl.innerHTML = formatDefinition(raw);
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  const candidate = json.candidates?.[0];
  const contentObj = candidate?.content;

  // Join all parts into a single string (or just take the first part)
  const explanation = contentObj?.parts
    ?.map(part => part.text)
    .join('') 
    || '(error)';
    
  return explanation;
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
