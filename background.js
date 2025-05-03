// background.js

// 1) On install, register the “Define” menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "defineSelection",
    title: "Define \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "defineSelection" && info.selectionText) {
    await chrome.storage.local.set({ lastSelection: info.selectionText });
    chrome.action.openPopup();
  }
});