// Background service worker for TL;DR extension
// Handles context menu (right-click) integration

// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'tldr-summarize',
    title: 'TL;DR: Summarize Selection',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;

  if (!selectedText) return;

  // Store the selected text and action type
  chrome.storage.local.set({
    contextMenuAction: {
      text: selectedText,
      type: info.menuItemId,
      timestamp: Date.now()
    }
  });

  // Open the popup
  chrome.action.openPopup();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContextMenuAction') {
    chrome.storage.local.get(['contextMenuAction'], (result) => {
      sendResponse(result.contextMenuAction || null);
    });
    return true; // Will respond asynchronously
  }
});
