function getSelectedText() {
    return window.getSelection().toString();
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Find the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      // 2. Inject and run getSelectedText() in that tab
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: getSelectedText
        },
        (results) => {
          // 3. results is an array; grab the first result’s value
          const sel = results[0]?.result || '(no text selected)';
          document.getElementById('selection').textContent = sel;
        }
      );
    });
  });