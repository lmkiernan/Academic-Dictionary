// background.js

// on install, register the "Define" menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "defineSelection",
    title: "Define \"%s\"",
    contexts: ["selection"]
  });
  
  chrome.storage.local.set({ freshSelection: false });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "defineSelection" && info.selectionText) {
    console.log("context menu clicked, setting freshSelection to true");
    
    try {
      await chrome.storage.local.set({ freshSelection: true });
      await chrome.storage.local.set({ lastSelection: info.selectionText });
      
      chrome.action.openPopup();
    } catch (error) {
      console.error("error in context menu handler:", error);
    }
  }
});