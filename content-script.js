// Jaipur Reels Explorer - Content Script

let isScrapingActive = false;
let scrapingInterval = null;
let processedReels = new Set();
let scannedCount = 0;
let matchCount = 0;

// Log initialization
console.log("Jaipur Reels Explorer content script injected successfully.");

// Listen for control commands from the sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  
  if (message.action === "START_SCRAPING") {
    const scrollDelay = message.scrollDelay || 2000;
    const targetCount = message.targetCount || 100;
    const keywords = message.keywords || [];
    
    startScraping(scrollDelay, targetCount, keywords);
    sendResponse({ success: true, status: "started" });
  } 
  else if (message.action === "STOP_SCRAPING") {
    stopScraping();
    sendResponse({ success: true, status: "stopped" });
  }
  else if (message.action === "GET_STATUS") {
    sendResponse({ 
      isScrapingActive, 
      scannedCount, 
      matchCount,
      processedCount: processedReels.size
    });
  }
  else if (message.action === "RESET_STATE") {
    resetState();
    sendResponse({ success: true, status: "reset" });
  }
  return true;
});

function resetState() {
  stopScraping();
  processedReels.clear();
  scannedCount = 0;
  matchCount = 0;
}

function stopScraping() {
  isScrapingActive = false;
  if (scrapingInterval) {
    clearInterval(scrapingInterval);
    scrapingInterval = null;
  }
  console.log("Scraping paused / stopped.");
  
  // Notify sidepanel about status change
  chrome.runtime.sendMessage({
    action: "SCRAPING_PAUSED",
    data: { scannedCount, matchCount }
  });
}

function startScraping(scrollDelay, targetCount, keywords) {
  if (isScrapingActive) return;
  
  isScrapingActive = true;
  console.log(`Starting scraper with delay: ${scrollDelay}ms, target: ${targetCount}, keywords:`, keywords);
  
  // Instantly run the first scan, then set interval
  scanCurrentReel(keywords, targetCount);
  
  scrapingInterval = setInterval(() => {
    if (!isScrapingActive) return;
    
    // Scroll to next reel first
    scrollToNextReel();
    
    // Wait a brief moment to let content load, then scan
    setTimeout(() => {
      if (!isScrapingActive) return;
      scanCurrentReel(keywords, targetCount);
    }, 1500); // 1.5s buffer after scrolling to give React ample time to load overlays
    
  }, scrollDelay + 1500); // add 1.5s scroll buffer to the interval
}

function scrollToNextReel() {
  console.log("Advancing to next reel using defense-in-depth navigation...");
  
  // Method 1: Dispatch native ArrowDown event to document, active element, and body (highly effective if focus is present)
  const arrowDownEvent = new KeyboardEvent('keydown', {
    key: 'ArrowDown',
    keyCode: 40,
    code: 'ArrowDown',
    which: 40,
    bubbles: true,
    cancelable: true
  });
  
  const target = document.activeElement || document.body || document;
  target.dispatchEvent(arrowDownEvent);
  document.dispatchEvent(arrowDownEvent);
  window.dispatchEvent(arrowDownEvent);

  // Method 2: Click floating navigation buttons if visible (Instagram desktop pagination chevrons)
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    const svg = btn.querySelector('svg');
    if (svg) {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const path = svg.querySelector('path');
      const dAttr = path ? path.getAttribute('d') || '' : '';
      
      // Look for chevrons or next labels
      if (
        ariaLabel.toLowerCase().includes('next') || 
        ariaLabel.toLowerCase().includes('down') || 
        dAttr.includes('M12 21') || 
        dAttr.includes('m12') ||
        dAttr.includes('M19 13') ||
        btn.classList.contains('coreSpriteRightPaginationArrow')
      ) {
        btn.click();
        console.log("Method 2 Success: Programmatically clicked next pagination button.");
        return;
      }
    }
  }

  // Method 3: Traverse DOM to locate the actual active scrollable container and scroll by height
  setTimeout(() => {
    let scrollContainer = null;
    const divs = document.querySelectorAll('div');
    
    for (const div of divs) {
      const style = window.getComputedStyle(div);
      if (
        div.scrollHeight > div.clientHeight + 10 && 
        div.clientHeight > 200 && 
        (style.overflowY === 'auto' || style.overflowY === 'scroll')
      ) {
        // Confirm this div houses the active video or article elements
        if (div.querySelector('article') || div.querySelector('video')) {
          scrollContainer = div;
          break;
        }
      }
    }
    
    // If container is found, scroll down exactly one reel viewport height
    if (scrollContainer) {
      scrollContainer.scrollBy({
        top: scrollContainer.clientHeight || window.innerHeight,
        behavior: 'smooth'
      });
      console.log("Method 3 Success: Scrolled native reels overflow container by height:", scrollContainer.clientHeight);
    } else {
      // Method 4: Fallback scroll of window or documentElement by viewport height
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth'
      });
      document.documentElement.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth'
      });
      console.log("Method 4 Success: Scrolled document window by viewport height:", window.innerHeight);
    }
  }, 50);
}

function getActiveReelIndex(articles) {
  for (let i = 0; i < articles.length; i++) {
    const rect = articles[i].getBoundingClientRect();
    if (rect.top >= -100 && rect.top <= window.innerHeight / 2) {
      return i;
    }
  }
  return -1;
}

function getActiveReelElement() {
  const articles = document.querySelectorAll('article');
  const index = getActiveReelIndex(articles);
  if (index !== -1) {
    return articles[index];
  }
  
  // Fallback 1: Get article closest to viewport center
  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    if (rect.top >= -200 && rect.top <= window.innerHeight * 0.8) {
      return article;
    }
  }
  
  // Fallback 2: Any active video element's container (climbing up DOM for true Reels container card containing description overlays)
  const videos = document.querySelectorAll('video');
  for (const video of videos) {
    const rect = video.getBoundingClientRect();
    if (rect.top >= -200 && rect.top <= window.innerHeight * 0.8) {
      const article = video.closest('article');
      if (article) return article;
      
      // Climb up DOM to find the container holding links, username, and description text
      let current = video;
      for (let i = 0; i < 7; i++) {
        if (!current || current === document.body) break;
        const links = current.querySelectorAll('a');
        // A true reels slide card container will contain several overlay elements, buttons, and text
        if (links.length >= 2 && current.textContent.trim().length > 10) {
          return current;
        }
        current = current.parentElement;
      }
      return video.parentElement;
    }
  }
  return null;
}

async function scanCurrentReel(keywords_fallback, targetCount) {
  if (scannedCount >= targetCount) {
    console.log("Reached targeted scan limit of:", targetCount);
    stopScraping();
    chrome.runtime.sendMessage({
      action: "SCRAPING_COMPLETED",
      data: { scannedCount, matchCount }
    });
    return;
  }
  
  let activeReel = getActiveReelElement();
  if (!activeReel) {
    console.warn("Could not detect active reel container in the DOM.");
    return;
  }
  
  // Smart Polling: Wait for dynamic React content to finish mounting overlays (max 5 attempts, 200ms apart)
  for (let attempt = 0; attempt < 5; attempt++) {
    const tempUsername = getUsername(activeReel);
    const contentLen = activeReel.textContent.trim().length;
    // A fully loaded Reel has profile links and layout text (follow, sound, comment nodes, etc.)
    if (tempUsername !== "instagram_user" && contentLen > 40) {
      break; // Successfully loaded!
    }
    console.log(`[Scraper] Reel DOM still rendering (Attempt ${attempt + 1}/5). Waiting 200ms...`);
    await new Promise(resolve => setTimeout(resolve, 200));
    activeReel = getActiveReelElement() || activeReel; // Refetch in case of virtualized shifting
  }
  
  // Extract Reel URL
  let reelUrl = window.location.href;
  if (!reelUrl.includes('/reels/') && !reelUrl.includes('/p/')) {
    // Try to find the link in the article
    const reelLink = activeReel.querySelector('a[href*="/reels/"], a[href*="/p/"]');
    if (reelLink) {
      reelUrl = 'https://www.instagram.com' + reelLink.getAttribute('href');
    } else {
      // Generate a temporary unique ID using timestamp so we don't skip scanning if URL is not loaded yet
      reelUrl = 'https://www.instagram.com/reels/temp_' + Date.now();
    }
  }
  
  // Clean URL to keep just the base path
  const urlCleaned = reelUrl.split('?')[0];
  
  // Check if already processed in this session
  if (processedReels.has(urlCleaned)) {
    console.log("Reel already scanned, skipping duplicate:", urlCleaned);
    return;
  }
  
  // Mark as processed
  processedReels.add(urlCleaned);
  scannedCount++;
  
  // Gather DOM elements text
  const captionText = getCaptionText(activeReel);
  const locationInfo = getLocationInfo(activeReel);
  const username = getUsername(activeReel);
  const viewportText = getViewportText();
  
  // Clean activeReel text of song/audio titles to prevent false positive keyword matching on songs
  let cleanedReelText = activeReel.textContent;
  const audioLink = activeReel.querySelector('a[href*="/audio/"], a[href*="/reels/audio/"]');
  if (audioLink) {
    const audioText = audioLink.textContent.trim();
    cleanedReelText = cleanedReelText.replace(audioText, "");
  }
  
  // Full text compilation for exhaustive keyword scanning (excluding songs)
  const fullText = (
    captionText + " " + 
    (locationInfo ? locationInfo.name : "") + " " + 
    username + " " + 
    cleanedReelText + " " + 
    viewportText
  ).toLowerCase();

  // Load keywords dynamically from storage to support live dashboard updates without pausing
  const storageData = await chrome.storage.local.get("keywords");
  const keywords = storageData.keywords || keywords_fallback || [];
  
  console.log(`[Scraper] Scanned Reel #${scannedCount} - ${urlCleaned}`);
  console.log(`[Scraper] Username: @${username}`);
  console.log(`[Scraper] Location: ${locationInfo ? locationInfo.name : 'None'}`);
  console.log(`[Scraper] Extracted Caption: "${captionText}"`);
  console.log(`[Scraper] Active Keywords to check:`, keywords);
  console.log(`[Scraper] Scanned Full DOM Content length: ${fullText.length} characters.`);
  
  // Match keywords
  const matchedKeywords = [];
  let relevanceScore = 0;
  
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (fullText.includes(kwLower)) {
      matchedKeywords.push(kw);
      
      // Calculate relevance weights
      let scoreWeight = 1;
      
      // Location match is highly relevant
      if (locationInfo && locationInfo.name.toLowerCase().includes(kwLower)) {
        scoreWeight += 4;
      }
      // Caption match is moderately relevant
      if (captionText.toLowerCase().includes(kwLower)) {
        scoreWeight += 2;
      }
      
      // Count total matches in full text to scale relevance
      const matchesInText = (fullText.match(new RegExp(escapeRegExp(kwLower), 'g')) || []).length;
      relevanceScore += scoreWeight + Math.min(3, matchesInText - 1);
    }
  });
  
  const isMatch = matchedKeywords.length > 0;
  let reelData = null;
  
  if (isMatch) {
    matchCount++;
    reelData = {
      id: urlCleaned.split('/').filter(Boolean).pop() || 'reel_' + Date.now(),
      url: urlCleaned,
      author: username,
      caption: captionText || "No caption",
      locationName: locationInfo ? locationInfo.name : "",
      locationUrl: locationInfo ? locationInfo.url : "",
      matches: matchedKeywords,
      relevanceScore: Math.round(relevanceScore),
      timestamp: Date.now()
    };
    
    console.log("🎉 MATCH FOUND Related to Jaipur:", reelData);
    
    // Save to storage
    const { scrapedReels = [] } = await chrome.storage.local.get("scrapedReels");
    
    // De-duplicate in persistent storage
    if (!scrapedReels.some(r => r.url === urlCleaned)) {
      scrapedReels.push(reelData);
      await chrome.storage.local.set({ scrapedReels });
    }
  }
  
  // Notify Side Panel in real-time
  chrome.runtime.sendMessage({
    action: "PROGRESS_UPDATE",
    data: {
      scannedCount,
      matchCount,
      processedCount: processedReels.size,
      newMatch: reelData
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCaptionText(article) {
  // Method 0: Find caption directly in the screen viewport (highly resilient!)
  const vpCaption = getCaptionFromViewport();
  if (vpCaption) return vpCaption;

  // Method 1: Find by explore tags
  const tagLink = article.querySelector('a[href*="/explore/tags/"]');
  if (tagLink) {
    const parentContainer = tagLink.closest('span') || tagLink.parentElement;
    if (parentContainer) {
      return parentContainer.textContent.trim();
    }
  }
  
  // Method 2: Sibling elements near profile link (typical Instagram layout)
  const usernameLink = article.querySelector('a[href^="/"]');
  if (usernameLink) {
    const headerContainer = usernameLink.closest('header') || usernameLink.parentElement;
    if (headerContainer) {
      const nextContainer = headerContainer.nextElementSibling;
      if (nextContainer && nextContainer.querySelector('span')) {
        return nextContainer.querySelector('span').textContent.trim();
      }
    }
  }
  
  // Method 3: Scan spans for the longest descriptive block (resilient fallback)
  const spans = article.querySelectorAll('span');
  let bestSpan = "";
  for (const span of spans) {
    const text = span.textContent.trim();
    
    // Ignore empty spans, buttons, headers, and navigation overlays
    if (text.length > bestSpan.length && text.length > 5 && text.length < 500) {
      if (
        span.closest('button') || 
        span.closest('header') || 
        span.closest('nav') || 
        span.closest('svg') ||
        /^\d+[mhdw]$/i.test(text) || // ignore duration tags (e.g. 5m, 2h, 1d)
        text.toLowerCase() === 'follow' || 
        text.toLowerCase() === 'original audio' ||
        text.toLowerCase().includes('view all')
      ) {
        continue;
      }
      bestSpan = text;
    }
  }
  return bestSpan || "";
}

function getLocationInfo(article) {
  // Method 0: Check viewport locations first
  const vpLocation = getLocationFromViewport();
  if (vpLocation) return vpLocation;

  const locationLink = article.querySelector('a[href*="/explore/locations/"]');
  if (locationLink) {
    return {
      name: locationLink.textContent.trim(),
      url: 'https://www.instagram.com' + locationLink.getAttribute('href')
    };
  }
  return null;
}

function getUsername(article) {
  // Method 0: Check viewport username first
  const vpUsername = getUsernameFromViewport();
  if (vpUsername !== "instagram_user") return vpUsername;

  const links = article.querySelectorAll('a');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;
    
    // Match /username/ path structure
    const match = href.match(/^\/([a-zA-Z0-9._]+)\/$/);
    if (match) {
      const username = match[1];
      const excluded = ['reels', 'explore', 'direct', 'emails', 'developer', 'about', 'blog', 'jobs', 'help', 'api', 'privacy', 'terms', 'locations'];
      if (!excluded.includes(username)) {
        return username;
      }
    }
  }
  return "instagram_user";
}

// ==========================================
// VIEWPORT VISUAL SCRAPING ENGINES
// ==========================================

function getViewportText() {
  let combinedText = "";
  const elements = document.querySelectorAll('span, a, p, h1, h2, h3, div');
  
  for (const el of elements) {
    // Look strictly at leaf text nodes to avoid duplicate text structures
    if (el.children.length === 0 || (el.children.length === 1 && el.firstElementChild.tagName === 'SPAN')) {
      const rect = el.getBoundingClientRect();
      
      // Match coordinates inside active center-right Reels viewport, ignoring left navigation bar
      if (
        rect.top >= 0 && 
        rect.bottom <= window.innerHeight && 
        rect.left >= window.innerWidth * 0.1 && 
        rect.right <= window.innerWidth * 0.95 &&
        rect.width > 0 &&
        rect.height > 0
      ) {
        // Skip audio/music links completely to prevent matching song/audio names
        if (el.closest('a[href*="/audio/"]') || el.closest('a[href*="/reels/audio/"]')) {
          continue;
        }

        const text = el.textContent.trim();
        // Skip common nav keywords
        if (text && !['home', 'search', 'explore', 'reels', 'messages', 'notifications', 'create', 'profile'].includes(text.toLowerCase())) {
          combinedText += " " + text;
        }
      }
    }
  }
  return combinedText;
}

function getUsernameFromViewport() {
  const anchors = document.querySelectorAll('a');
  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');
    if (!href) continue;
    
    const match = href.match(/^\/([a-zA-Z0-9._]+)\/$/);
    if (match) {
      const username = match[1];
      const excluded = ['reels', 'explore', 'direct', 'emails', 'developer', 'about', 'blog', 'jobs', 'help', 'api', 'privacy', 'terms', 'locations'];
      if (!excluded.includes(username)) {
        const rect = anchor.getBoundingClientRect();
        if (
          rect.top >= 0 && 
          rect.bottom <= window.innerHeight && 
          rect.left >= window.innerWidth * 0.1 &&
          rect.width > 0
        ) {
          return username;
        }
      }
    }
  }
  return "instagram_user";
}

function getLocationFromViewport() {
  const anchors = document.querySelectorAll('a[href*="/explore/locations/"]');
  for (const anchor of anchors) {
    const rect = anchor.getBoundingClientRect();
    if (
      rect.top >= 0 && 
      rect.bottom <= window.innerHeight && 
      rect.left >= window.innerWidth * 0.1 &&
      rect.width > 0
    ) {
      return {
        name: anchor.textContent.trim(),
        url: 'https://www.instagram.com' + anchor.getAttribute('href')
      };
    }
  }
  return null;
}

function getCaptionFromViewport() {
  const elements = document.querySelectorAll('span, p, div');
  let bestText = "";
  for (const el of elements) {
    if (el.children.length === 0 || (el.children.length === 1 && el.firstElementChild.tagName === 'SPAN')) {
      const rect = el.getBoundingClientRect();
      if (
        rect.top >= window.innerHeight * 0.25 && 
        rect.bottom <= window.innerHeight && 
        rect.left >= window.innerWidth * 0.1 && 
        rect.right <= window.innerWidth * 0.95 &&
        rect.width > 0 &&
        rect.height > 0
      ) {
        const text = el.textContent.trim();
        if (text.length > bestText.length && text.length > 5 && text.length < 350) {
          if (
            el.closest('button') || 
            el.closest('header') || 
            /^\d+[mhdw]$/i.test(text) || 
            text.toLowerCase() === 'follow' || 
            text.toLowerCase() === 'original audio' ||
            text.toLowerCase().includes('view all')
          ) {
            continue;
          }
          bestText = text;
        }
      }
    }
  }
  return bestText;
}
