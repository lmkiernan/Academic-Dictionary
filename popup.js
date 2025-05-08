const PROVIDERS = { OPENAI: 'openai', GEMINI: 'gemini' };
let provider;

function showSection(id) {
  document.querySelectorAll('#openaiInput, #geminiInput, #mainView')
    .forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// add loading state to buttons
function setButtonLoading(buttonId, isLoading, originalText = null) {
  const button = document.getElementById(buttonId);
  
  if (isLoading) {
    const btnText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    return btnText;
  } else {
    button.disabled = false;
    if (originalText) {
      button.innerHTML = originalText;
    }
    return null;
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }, 10);
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
        const originalText = setButtonLoading('saveOpenAIKey', true);
        const key = document.getElementById('openAIKeyInput').value.trim();
        
        if (key.startsWith('sk-')) {
          chrome.storage.local.set({ provider: PROVIDERS.OPENAI, openAIKey: key }, () => {
            setButtonLoading('saveOpenAIKey', false, originalText);
            showNotification('OpenAI API key saved successfully!');
            initMainView();
          });
        } else {
          setButtonLoading('saveOpenAIKey', false, originalText);
          showNotification('Invalid OpenAI key format. Must start with "sk-".', 'error');
        }
      };

      document.getElementById('saveGeminiKey').onclick = () => {
        const originalText = setButtonLoading('saveGeminiKey', true);
        const key = document.getElementById('geminiKeyInput').value.trim();
        
        if (key) {
          chrome.storage.local.set({ provider: PROVIDERS.GEMINI, geminiKey: key }, () => {
            setButtonLoading('saveGeminiKey', false, originalText);
            showNotification('Gemini API key saved successfully!');
            initMainView();
          });
        } else {
          setButtonLoading('saveGeminiKey', false, originalText);
          showNotification('Please enter a valid Gemini key.', 'error');
        }
      };
    } else {
      initMainView(data);
    }
  });
});

function formatDefinition(raw) {
  if (!raw) return '';
  let escaped = raw
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const lines = escaped.split('\n');
  let inList = false;
  const out = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      continue;
    }
    if (line.startsWith('* ')) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${line.slice(2)}</li>`);
    } else {
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

  const selectionEl = document.getElementById('selection');
  const saveNoteBtn = document.getElementById('saveNote');
  const simplerBtn = document.getElementById('simplerBtn');
  
  selectionEl.textContent = data.lastSelection || '(no text selected)';
  
  // change styling if no selection
  if (!data.lastSelection) {
    selectionEl.style.backgroundColor = '#f8f9fa';
    selectionEl.style.borderLeftColor = '#adb5bd';
    saveNoteBtn.disabled = true;
    simplerBtn.disabled = true;
  } else {
    saveNoteBtn.disabled = false;
    simplerBtn.disabled = false;
  }
  
  renderNotes(data.myNotes || []);

  // check if there's selected text and show loading indicator right away
  if (data.lastSelection) {
    const defEl = document.getElementById('definition');
    defEl.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
      </div>`;
    
    // disable save button during loading
    saveNoteBtn.disabled = true;
      
    // check for fresh selection flag
    chrome.storage.local.get('freshSelection', (result) => {
      console.log('fresh selection status:', result.freshSelection);
      
      if (result.freshSelection === true) {
        // fetch the definition for a fresh selection
        fetchDefinition(data.lastSelection);
        // reset the flag 
        chrome.storage.local.set({ freshSelection: false });
      } else {
        // if we have a selection but it's not fresh, give the user the option to refresh
        defEl.innerHTML = `
          <p class="empty-state">
            Click "Define" below to get a definition for "${data.lastSelection}"
          </p>
          <button id="defineBtn" class="btn btn-primary">
            <i class="fas fa-book"></i> Define
          </button>
        `;
        
        // keep save button disabled until we have a definition
        saveNoteBtn.disabled = true;
        
        // add click handler for the Define button
        document.getElementById('defineBtn').onclick = () => {
          fetchDefinition(data.lastSelection);
        };
      }
    });
  } else {
    // no selection at all
    document.getElementById('definition').innerHTML = '<p class="empty-state">Select text on a webpage, right-click, and choose "Define" to see a definition here.</p>';
    saveNoteBtn.disabled = true;
  }

  simplerBtn.onclick = () => {
    const text = document.getElementById('selection').textContent;
    if (text && text !== '(no text selected)') {
      fetchDefinition(text, true);
    } else {
      showNotification('Please select text first.', 'error');
    }
  };
  
  saveNoteBtn.onclick = () => {
    const text = document.getElementById('selection').textContent;
    if (text && text !== '(no text selected)') {
      saveCurrentNote();
    } else {
      showNotification('Nothing to save.', 'error');
    }
  };
  
  document.getElementById('aboutBtn').onclick = () => {
    chrome.tabs.create({ url: 'https://github.com/yourusername/Academic-Dictionary' });
  };
  
  // add settings button functionality
  document.getElementById('settingsBtn').onclick = () => {
    goToSettings();
  };
}

// function to go back to the API key settings screen
function goToSettings() {
  document.getElementById('mainView').classList.add('hidden');
  document.getElementById('keyView').classList.remove('hidden');
  
  chrome.storage.local.get('provider', (data) => {
    const currentProvider = data.provider;
    
    document.querySelectorAll('#openaiInput, #geminiInput').forEach(el => el.classList.add('hidden'));
    
    // setup provider selection buttons
    document.getElementById('useOpenAI').onclick = () => showSection('openaiInput');
    document.getElementById('useGemini').onclick = () => showSection('geminiInput');
    
    // setup api key save buttons
    document.getElementById('saveOpenAIKey').onclick = () => {
      const originalText = setButtonLoading('saveOpenAIKey', true);
      const key = document.getElementById('openAIKeyInput').value.trim();
      
      if (key.startsWith('sk-')) {
        chrome.storage.local.set({ provider: PROVIDERS.OPENAI, openAIKey: key }, () => {
          setButtonLoading('saveOpenAIKey', false, originalText);
          showNotification('OpenAI API key saved successfully!');
          initMainView();
        });
      } else {
        setButtonLoading('saveOpenAIKey', false, originalText);
        showNotification('Invalid OpenAI key format. Must start with "sk-".', 'error');
      }
    };

    document.getElementById('saveGeminiKey').onclick = () => {
      const originalText = setButtonLoading('saveGeminiKey', true);
      const key = document.getElementById('geminiKeyInput').value.trim();
      
      if (key) {
        chrome.storage.local.set({ provider: PROVIDERS.GEMINI, geminiKey: key }, () => {
          setButtonLoading('saveGeminiKey', false, originalText);
          showNotification('Gemini API key saved successfully!');
          initMainView();
        });
      } else {
        setButtonLoading('saveGeminiKey', false, originalText);
        showNotification('Please enter a valid Gemini key.', 'error');
      }
    };
    
    if (currentProvider) {
      if (currentProvider === PROVIDERS.OPENAI) {
        showSection('openaiInput');
      } else if (currentProvider === PROVIDERS.GEMINI) {
        showSection('geminiInput');
      }
    }
  });
}

async function fetchDefinition(text, simpler = false) {
  const defEl = document.getElementById('definition');
  const saveNoteBtn = document.getElementById('saveNote');
  
  // disable save button during loading
  saveNoteBtn.disabled = true;
  
  defEl.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
    </div>`;

  let raw;
  try {
    if (provider === PROVIDERS.OPENAI) {
      const { openAIKey } = await chrome.storage.local.get('openAIKey');
      if (!openAIKey) {
        throw new Error("OpenAI API key not found. Please set up your API key.");
      }
      raw = await callOpenAI(openAIKey, text, simpler);
    } else {
      const { geminiKey } = await chrome.storage.local.get('geminiKey');
      if (!geminiKey) {
        throw new Error("Gemini API key not found. Please set up your API key.");
      }
      raw = await callGemini(geminiKey, text, simpler);
    }

    // check if we got a valid response
    if (!raw || raw === '(error)' || raw === '(No definition found)') {
      throw new Error("Could not get a definition. The API may be experiencing issues.");
    }

    // format and display the definition
    defEl.innerHTML = formatDefinition(raw);
    
    // enable save button since we have a definition
    saveNoteBtn.disabled = false;
    
  } catch (error) {
    console.error('error fetching definition:', error);
    defEl.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i> 
        <strong>Error:</strong> ${error.message || 'Failed to fetch definition'}
      </div>
      <button id="retryBtn" class="btn btn-primary" style="margin-top: 15px;">
        <i class="fas fa-redo"></i> Try Again
      </button>
    `;
    
    // keep save button disabled since we have an error
    saveNoteBtn.disabled = true;
    
    // add a retry button event listener
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => fetchDefinition(text, simpler));
    }
  }
}

async function callOpenAI(key, text, simpler) {
  const prompt = simpler
    ? `Explain the concept of "${text}" in simple terms that a general audience would understand. Include a brief example to illustrate the concept.`
    : `Define the term "${text}" in an academic context. Include key aspects, scholarly significance, and relevant academic fields where this term is used.`;

  try {
    console.log("Calling OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI error response:", errorData);
      throw new Error(errorData.error?.message || `OpenAI API error (${response.status})`);
    }
    
    const json = await response.json();
    return json.choices?.[0]?.message?.content || '(No definition found)';
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error.message.includes('API key')) {
      throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
    } else if (error.message.includes('429')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      throw new Error('OpenAI servers are currently experiencing issues. Please try again later.');
    } else {
      throw new Error(`Failed to connect to OpenAI API: ${error.message}`);
    }
  }
}

async function callGemini(key, text, simpler) {
  const prompt = simpler
    ? `Explain the concept of "${text}" in simple terms that a general audience would understand. Include a brief example to illustrate the concept.`
    : `Define the term "${text}" in an academic context. Include key aspects, scholarly significance, and relevant academic fields where this term is used.`;

  try {
    console.log("Calling Gemini API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Gemini error response:", errorData);
      throw new Error(errorData.error?.message || `Gemini API error (${res.status})`);
    }
    
    const json = await res.json();
    if (json.promptFeedback && json.promptFeedback.blockReason) {
      throw new Error(`Gemini rejected the prompt: ${json.promptFeedback.blockReason}`);
    }
    
    const candidate = json.candidates?.[0];
    if (!candidate) {
      throw new Error("No response generated by Gemini");
    }
    
    const contentObj = candidate?.content;
    if (!contentObj || !contentObj.parts || contentObj.parts.length === 0) {
      throw new Error("Empty response from Gemini");
    }

    const explanation = contentObj.parts
      .map(part => part.text)
      .join('') 
      || '(No definition found)';
      
    return explanation;
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error.message.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key in settings.');
    } else if (error.message.includes('429')) {
      throw new Error('Gemini API rate limit exceeded. Please try again later.');
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      throw new Error('Gemini servers are currently experiencing issues. Please try again later.');
    } else {
      throw new Error(`Failed to connect to Gemini API: ${error.message}`);
    }
  }
}

function renderNotes(notes) {
  const list = document.getElementById('notesList');
  const countEl = document.getElementById('noteCount');
  
  countEl.textContent = `(${notes.length})`;
  
  if (!notes.length) {
    list.innerHTML = '<p class="empty-notes">No saved notes yet. Save a definition to see it here.</p>';
    return;
  }
  
  list.innerHTML = '';
  notes.forEach(note => {
    const div = document.createElement('div');
    div.className = 'note-item';
    
    div.innerHTML = `
      <div class="note-date">${new Date(note.timestamp).toLocaleString()}</div>
      <div class="note-text">${note.text}</div>
      <div class="note-definition"></div>
    `;

    const defContainer = div.querySelector('.note-definition');
    defContainer.innerHTML = note.def;
    
    // add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline btn-small';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteBtn.onclick = () => deleteNote(note.timestamp);
    div.appendChild(deleteBtn);
    
    list.appendChild(div);
  });
}

function saveCurrentNote() {
  const text = document.getElementById('selection').textContent;
  const defEl = document.getElementById('definition');
  const hasInstructions = defEl.textContent.includes('Click "Define"') || 
                          defEl.textContent.includes('Select text on a webpage') ||
                          defEl.querySelector('.empty-state') !== null;
                          
  const hasLoadingSpinner = defEl.querySelector('.loading-spinner') !== null;
  
  if (hasInstructions || hasLoadingSpinner) {
    showNotification('Please load a definition first.', 'error');
    return;
  }
  
  const def = defEl.innerHTML;
  
  chrome.storage.local.get('myNotes', data => {
    const notes = data.myNotes || [];
    
    // check if we already have this term saved
    const existingIndex = notes.findIndex(note => note.text === text);
    if (existingIndex !== -1) {
      // update existing note
      notes[existingIndex].def = def;
      notes[existingIndex].timestamp = new Date().toISOString();
      
      // move it to the top
      const updatedNote = notes.splice(existingIndex, 1)[0];
      notes.unshift(updatedNote);
      
      showNotification('Note updated successfully!');
    } else {
      // add new note
      notes.unshift({ 
        text, 
        def, 
        timestamp: new Date().toISOString() 
      });
      
      // keep only the last 10 notes
      if (notes.length > 10) notes.pop();
    }
    
    chrome.storage.local.set({ myNotes: notes }, () => renderNotes(notes));
  });
}

function deleteNote(timestamp) {
  chrome.storage.local.get('myNotes', data => {
    const notes = data.myNotes || [];
    const updatedNotes = notes.filter(note => note.timestamp !== timestamp);
    
    chrome.storage.local.set({ myNotes: updatedNotes }, () => {
      renderNotes(updatedNotes);
      showNotification('Note deleted successfully!');
    });
  });
}

// add css for notifications
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      width: 280px;
      background-color: var(--success);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      transition: transform 0.3s ease;
    }
    
    .notification-content {
      display: flex;
      align-items: center;
    }
    
    .notification-content i {
      margin-right: 10px;
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .notification-text {
      flex-grow: 1;
      word-break: break-word;
    }
    
    .notification.show {
      transform: translateX(-50%) translateY(0);
    }
    
    .notification.error {
      background-color: white;
    }
    
    .empty-state {
      color: var(--light-text);
      text-align: center;
      padding: 20px 0;
    }
    
    .empty-notes {
      color: var(--light-text);
      text-align: center;
      padding: 10px 0;
    }
    
    .error {
      color: var(--error);
      padding: 10px;
      border-left: 3px solid var(--error);
      background-color: rgba(250, 82, 82, 0.1);
      border-radius: 4px;
      margin: 10px 0;
    }
  `;
  document.head.appendChild(style);
});