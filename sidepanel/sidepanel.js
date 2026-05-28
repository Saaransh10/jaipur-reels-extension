// Jaipur Reels Explorer - Sidepanel Controller

// Global UI Elements
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

const metricScanned = document.getElementById("metric-scanned");
const metricMatches = document.getElementById("metric-matches");
const metricRate = document.getElementById("metric-rate");
const progressBarFill = document.getElementById("progress-bar-fill");

const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnReset = document.getElementById("btn-reset");

const limitInput = document.getElementById("limit-input");
const delaySlider = document.getElementById("delay-slider");
const delayVal = document.getElementById("delay-val");

const kwAddInput = document.getElementById("kw-add-input");
const btnAddKw = document.getElementById("btn-add-kw");
const kwTagsContainer = document.getElementById("kw-tags-container");
const btnRestoreKw = document.getElementById("btn-restore-kw");

const btnExportCsv = document.getElementById("btn-export-csv");
const btnExportJson = document.getElementById("btn-export-json");
const reelsFeed = document.getElementById("reels-feed");

// State trackers
let keywordsList = [];
let localReelsList = [];

// Initialize Sidepanel
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Sidepanel DOM fully loaded.");
  
  // Load saved settings & state
  await loadSavedState();
  
  // Attach listeners
  btnStart.addEventListener("click", handleStart);
  btnPause.addEventListener("click", handlePause);
  btnReset.addEventListener("click", handleReset);
  
  delaySlider.addEventListener("input", (e) => {
    delayVal.textContent = (e.target.value / 1000).toFixed(1) + "s";
  });
  
  btnAddKw.addEventListener("click", handleAddKeyword);
  kwAddInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddKeyword();
  });
  
  btnRestoreKw.addEventListener("click", handleRestoreKeywords);
  
  btnExportCsv.addEventListener("click", exportToCSV);
  btnExportJson.addEventListener("click", exportToJSON);
  
  // Query active scraper status from active Instagram tab
  syncStatusWithTab();
});

// Sync UI status on message reception
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Sidepanel received message:", message);
  
  if (message.action === "PROGRESS_UPDATE") {
    const { scannedCount, matchCount, newMatch } = message.data;
    
    // Update labels
    updateMetricsUI(scannedCount, matchCount);
    
    if (newMatch) {
      // Append matched reel in real-time
      appendReelToFeed(newMatch);
      // Reload from storage to keep memory synchronized
      chrome.storage.local.get("scrapedReels", (result) => {
        localReelsList = result.scrapedReels || [];
        toggleExportButtons();
      });
    }
  } 
  else if (message.action === "SCRAPING_COMPLETED") {
    setScrapingUIActive(false);
    updateStatus("Completed", "idle");
    const { scannedCount, matchCount } = message.data;
    updateMetricsUI(scannedCount, matchCount);
  }
  else if (message.action === "SCRAPING_PAUSED") {
    setScrapingUIActive(false);
    updateStatus("Paused", "paused");
    const { scannedCount, matchCount } = message.data;
    updateMetricsUI(scannedCount, matchCount);
  }
  
  return false;
});

// Load settings from storage
async function loadSavedState() {
  const result = await chrome.storage.local.get([
    "keywords", 
    "targetCount", 
    "scrollDelay", 
    "scrapedReels"
  ]);
  
  // Populate keywords
  keywordsList = result.keywords || [];
  renderKeywords(keywordsList);
  
  // Populate limit & delay inputs
  if (result.targetCount) {
    limitInput.value = result.targetCount;
  }
  if (result.scrollDelay) {
    delaySlider.value = result.scrollDelay;
    delayVal.textContent = (result.scrollDelay / 1000).toFixed(1) + "s";
  }
  
  // Populate feed list
  localReelsList = result.scrapedReels || [];
  renderReelsFeed(localReelsList);
  toggleExportButtons();
  
  // Load metrics
  const scanned = localReelsList.length; // placeholder metric fallback
  updateMetricsUI(scanned, scanned); // default initialization
}

// Request and verify content script status
async function syncStatusWithTab() {
  const tab = await getActiveInstagramTab();
  if (!tab) return;
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_STATUS" });
    if (response) {
      const { isScrapingActive, scannedCount, matchCount } = response;
      if (isScrapingActive) {
        setScrapingUIActive(true);
        updateStatus("Scanning Reels", "active");
      }
      updateMetricsUI(scannedCount, matchCount);
    }
  } catch (err) {
    console.log("Instagram tab does not have scraper injected or active yet.");
  }
}

// Start auto scrolling/scraping loop
async function handleStart() {
  const tab = await getActiveInstagramTab();
  
  if (!tab) {
    alert("⚠️ Instagram tab not detected.\n\nPlease open 'https://www.instagram.com/reels/' in a tab and verify you are logged in, then click 'Start Scraper' again.");
    return;
  }
  
  // Save parameters to local storage first
  const targetCount = parseInt(limitInput.value, 10) || 100;
  const scrollDelay = parseInt(delaySlider.value, 10) || 2500;
  
  await chrome.storage.local.set({ targetCount, scrollDelay });
  
  // Update state UI
  setScrapingUIActive(true);
  updateStatus("Scanning Reels...", "active");
  
  try {
    // Send trigger to content script, with dynamic script injection fallback
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        action: "START_SCRAPING",
        targetCount,
        scrollDelay,
        keywords: keywordsList
      });
    } catch (msgErr) {
      console.log("Active tab lacks content script. Programmatically injecting...", msgErr);
      
      // Inject content script programmatically
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content-script.js"]
      });
      
      // Wait a split second for script parsing/binding
      await new Promise(r => setTimeout(r, 200));
      
      // Retry message
      response = await chrome.tabs.sendMessage(tab.id, {
        action: "START_SCRAPING",
        targetCount,
        scrollDelay,
        keywords: keywordsList
      });
    }
    
    console.log("Scraper response:", response);
  } catch (err) {
    console.error("Communication failure with Instagram tab content script:", err);
    alert("⚠️ Connection Failed.\n\nPlease refresh your Instagram Reels tab and try again to activate the scraper.");
    setScrapingUIActive(false);
    updateStatus("Failed", "idle");
  }
}

// Pause scraping loop
async function handlePause() {
  const tab = await getActiveInstagramTab();
  if (!tab) return;
  
  setScrapingUIActive(false);
  updateStatus("Paused", "paused");
  
  try {
    await chrome.tabs.sendMessage(tab.id, { action: "STOP_SCRAPING" });
  } catch (err) {
    console.error("Failed to send stop signal:", err);
  }
}

// Reset scraped database
async function handleReset() {
  const confirmReset = confirm("🗑️ Are you sure you want to clear your current scraped feed list?\nThis will erase all collected Jaipur reels.");
  if (!confirmReset) return;
  
  // Clear persistent memory
  await chrome.storage.local.set({ scrapedReels: [] });
  localReelsList = [];
  
  // Reset Metrics
  updateMetricsUI(0, 0);
  renderReelsFeed(localReelsList);
  toggleExportButtons();
  
  // Send reset message to content script if available
  const tab = await getActiveInstagramTab();
  if (tab) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: "RESET_STATE" });
    } catch (err) {
      console.log("Reset content script signal failed. Inactive tab.");
    }
  }
  
  setScrapingUIActive(false);
  updateStatus("Ready", "idle");
}

// Helper to get active Instagram tab
async function getActiveInstagramTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  if (activeTab && activeTab.url && activeTab.url.includes("instagram.com")) {
    return activeTab;
  }
  
  // Fallback: look for ANY open Instagram tab
  const allTabs = await chrome.tabs.query({ url: "*://*.instagram.com/*" });
  return allTabs[0] || null;
}

// State UI helper
function setScrapingUIActive(isActive) {
  btnStart.disabled = isActive;
  btnPause.disabled = !isActive;
  limitInput.disabled = isActive;
  delaySlider.disabled = isActive;
}

function updateStatus(text, dotClass) {
  statusText.textContent = text;
  statusDot.className = `status-dot ${dotClass}`;
}

// Render dynamic elements
function updateMetricsUI(scanned, matches) {
  const limit = parseInt(limitInput.value, 10) || 100;
  
  metricScanned.textContent = scanned;
  metricMatches.textContent = matches;
  
  const rate = scanned > 0 ? Math.round((matches / scanned) * 100) : 0;
  metricRate.textContent = `${rate}% Match Rate`;
  
  const progressPercent = Math.min(100, Math.round((scanned / limit) * 100));
  progressBarFill.style.width = `${progressPercent}%`;
}

function toggleExportButtons() {
  const hasItems = localReelsList.length > 0;
  btnExportCsv.disabled = !hasItems;
  btnExportJson.disabled = !hasItems;
}

// Keywords list renderer
function renderKeywords(keywords) {
  kwTagsContainer.innerHTML = "";
  keywords.forEach((kw) => {
    const tag = document.createElement("div");
    tag.className = "kw-tag";
    tag.innerHTML = `
      <span>${kw}</span>
      <span class="kw-remove" data-kw="${kw}">&times;</span>
    `;
    
    tag.querySelector(".kw-remove").addEventListener("click", () => {
      handleRemoveKeyword(kw);
    });
    
    kwTagsContainer.appendChild(tag);
  });
}

async function handleAddKeyword() {
  const kw = kwAddInput.value.trim().toLowerCase();
  if (!kw) return;
  
  if (keywordsList.includes(kw)) {
    alert("Keyword already added!");
    return;
  }
  
  keywordsList.push(kw);
  await chrome.storage.local.set({ keywords: keywordsList });
  renderKeywords(keywordsList);
  kwAddInput.value = "";
}

async function handleRemoveKeyword(kw) {
  keywordsList = keywordsList.filter(item => item !== kw);
  await chrome.storage.local.set({ keywords: keywordsList });
  renderKeywords(keywordsList);
}

async function handleRestoreKeywords() {
  const defaults = [
    "jaipur", "pinkcity", "rajasthan", "hawa mahal", "hawamahal", 
    "amer fort", "amerfort", "amber fort", "amberfort", "jal mahal", 
    "jalmahal", "nahargarh", "jaigarh", "jantar mantar", "jantarmantar", 
    "city palace", "citypalace", "albert hall", "alberthall", "patrika gate", 
    "patrikagate", "chokhi dhani", "chokhidhani", "johri bazaar", "jaipur food", 
    "jaipur cafe", "rajasthani", "padharo mhare desh"
  ];
  
  keywordsList = defaults;
  await chrome.storage.local.set({ keywords: defaults });
  renderKeywords(defaults);
}

// Reels Feed List Renderer
function renderReelsFeed(reels) {
  reelsFeed.innerHTML = "";
  
  if (reels.length === 0) {
    reelsFeed.className = "reels-feed empty";
    reelsFeed.innerHTML = `
      <div id="empty-state" class="empty-state">
        <div class="empty-icon">🏰</div>
        <h3>No Jaipur Reels Loaded</h3>
        <p>Navigate to <a href="https://www.instagram.com/reels/" target="_blank">instagram.com/reels</a> and click "Start Scraper" to build your Jaipur compilation list!</p>
      </div>
    `;
    return;
  }
  
  reelsFeed.className = "reels-feed";
  // Prepend oldest or keep descending order (newest first is gorgeous)
  // Let's copy the array and reverse it to show newest matched reels on top
  const sortedReels = [...reels].reverse();
  
  sortedReels.forEach(reel => {
    reelsFeed.appendChild(createReelCardElement(reel));
  });
}

function appendReelToFeed(reel) {
  // Remove empty state if present
  const emptyState = document.getElementById("empty-state");
  if (emptyState) {
    reelsFeed.innerHTML = "";
    reelsFeed.className = "reels-feed";
  }
  
  // Prepend new card
  const newCard = createReelCardElement(reel);
  reelsFeed.insertBefore(newCard, reelsFeed.firstChild);
}

// Create a single Reel Card element
function createReelCardElement(reel) {
  const card = document.createElement("div");
  card.className = "reel-card";
  
  const initials = reel.author ? reel.author.substring(0, 2).toUpperCase() : "IG";
  const matchedBadges = reel.matches.map(m => `<span class="match-badge">${m}</span>`).join("");
  
  let locationHtml = "";
  if (reel.locationName) {
    locationHtml = `
      <a href="${reel.locationUrl || '#'}" target="_blank" class="location-badge">
        <svg class="location-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        ${reel.locationName}
      </a>
    `;
  }
  
  card.innerHTML = `
    <div class="reel-header">
      <a href="https://www.instagram.com/${reel.author}/" target="_blank" class="reel-user">
        <div class="avatar-placeholder">${initials}</div>
        <span class="username">@${reel.author}</span>
      </a>
      <span class="relevance-score">Score: ${reel.relevanceScore}</span>
    </div>
    <div class="reel-caption">${escapeHtml(reel.caption)}</div>
    <div class="reel-meta">
      ${locationHtml}
      <div class="reel-tags">
        ${matchedBadges}
      </div>
    </div>
    <div class="reel-footer-actions">
      <a href="${reel.url}" target="_blank" class="view-reel-link">
        View Reel ↗
      </a>
    </div>
  `;
  
  return card;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// CSV Export Generator
function exportToCSV() {
  if (localReelsList.length === 0) return;
  
  // Headers
  const headers = ["Reel ID", "URL", "Author/Username", "Location", "Location URL", "Relevance Score", "Matching Keywords", "Caption"];
  const rows = localReelsList.map(reel => [
    reel.id,
    reel.url,
    `@${reel.author}`,
    reel.locationName || "",
    reel.locationUrl || "",
    reel.relevanceScore,
    reel.matches.join(", "),
    reel.caption.replace(/[\n\r]+/g, " ") // Clean captions
  ]);
  
  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  
  triggerDownload(csvContent, "text/csv;charset=utf-8;", "jaipur_reels_compilation.csv");
}

// JSON Export Generator
function exportToJSON() {
  if (localReelsList.length === 0) return;
  
  const jsonContent = JSON.stringify(localReelsList, null, 2);
  triggerDownload(jsonContent, "application/json;charset=utf-8;", "jaipur_reels_compilation.json");
}

// Downloader Trigger
function triggerDownload(content, type, filename) {
  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
