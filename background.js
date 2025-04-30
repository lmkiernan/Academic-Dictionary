chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "defineSelection",
      title: "Define \"%s\"",
      contexts: ["selection"]
    });
  });
  
  // When the user clicks that menu item, save the selection:
  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "defineSelection" && info.selectionText) {
      chrome.storage.local.set({ lastSelection: info.selectionText });
    }
  });