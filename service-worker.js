// Jaipur Reels Explorer - Service Worker

// Enable Side Panel to open when the extension icon is clicked
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("Error setting panel behavior:", error));
  
  // Set default settings on install if they don't exist
  chrome.storage.local.get(["keywords", "targetCount", "scrollDelay"], (result) => {
    if (!result.keywords) {
      chrome.storage.local.set({
        keywords: [
          "jaipur", "pinkcity", "rajasthan", "hawa mahal", "hawamahal", 
          "amer fort", "amerfort", "amber fort", "amberfort", "jal mahal", 
          "jalmahal", "nahargarh", "jaigarh", "jantar mantar", "jantarmantar", 
          "city palace", "citypalace", "albert hall", "alberthall", "patrika gate", 
          "patrikagate", "chokhi dhani", "chokhidhani", "johri bazaar", "jaipur food", 
          "jaipur cafe", "rajasthani", "padharo mhare desh"
        ]
      });
    }
    if (!result.targetCount) {
      chrome.storage.local.set({ targetCount: 100 });
    }
    if (!result.scrollDelay) {
      chrome.storage.local.set({ scrollDelay: 2000 });
    }
  });
});

// Listener to coordinate message routing if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Let the messages pass freely or log them for debugging
  console.log("Service Worker received message:", message);
  
  if (message.action === "GET_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // Keep message channel open for async response
  }
  
  return false;
});
