// background.js

// 1) On install, register the “Define” menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "defineSelection",
      title: "Define \"%s\"",
      contexts: ["selection"]
    });
  });
  
  // 2) When the user clicks “Define …”:
  chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId === "defineSelection" && info.selectionText) {
      // store the selected text so popup.js can read it
      await chrome.storage.local.set({ lastSelection: info.selectionText });
  
      // open the extension’s popup immediately
      chrome.action.openPopup();
    }
  });