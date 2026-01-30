// Production API URL
const API_URL = 'https://tldr-article-summarizer-production.up.railway.app/api/summarize';

// Global state
let contextMenuData = null;

// Load saved configuration and check for context menu action
document.addEventListener('DOMContentLoaded', async () => {
  // Load theme preference
  const result = await chrome.storage.sync.get(['theme', 'colorScheme', 'defaultSummaryType']);

  const theme = result.theme || 'dark';
  document.body.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  // Load color scheme
  const colorScheme = result.colorScheme || 'purple';
  document.body.setAttribute('data-color', colorScheme);

  // Load default summary type
  const defaultSummaryType = result.defaultSummaryType || 'medium';
  document.getElementById('summaryType').value = defaultSummaryType;

  // Check if opened from context menu
  await checkContextMenuAction();
});

// Check for context menu action
async function checkContextMenuAction() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getContextMenuAction' });

    if (response && response.text) {
      contextMenuData = response;

      // Show context alert
      const alert = document.getElementById('contextAlert');
      const alertText = document.getElementById('contextAlertText');

      alertText.textContent = 'Ready to summarize selection';
      alert.style.display = 'block';

      // Auto-trigger summarization after a brief delay
      setTimeout(() => {
        document.getElementById('summarizeBtn').click();
      }, 800);

      // Clear the context menu action
      await chrome.storage.local.remove('contextMenuAction');
    }
  } catch (error) {
    console.log('No context menu action:', error);
  }
}

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', async () => {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.body.setAttribute('data-theme', newTheme);
  await chrome.storage.sync.set({ theme: newTheme });
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  const themeIcon = document.querySelector('.theme-icon use');
  themeIcon.setAttribute('href', theme === 'dark' ? '#icon-sun' : '#icon-moon');
}

// Main summarization function
document.getElementById('summarizeBtn').addEventListener('click', async () => {
  const button = document.getElementById('summarizeBtn');
  const summaryDiv = document.getElementById('summary');
  const actionsDiv = document.getElementById('actions');
  const summaryType = document.getElementById('summaryType').value;
  const startTime = Date.now();

  button.disabled = true;
  summaryDiv.classList.remove('visible');
  actionsDiv.style.display = 'none';
  hideStatus();
  showLoading('Analyzing article...');

  try {
    let content;
    let tab;

    // Check if we have content from context menu
    if (contextMenuData && contextMenuData.text) {
      content = contextMenuData.text;
      contextMenuData = null; // Clear after use

      // Get current tab for URL
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];
    } else {
      // Get the current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];

      // Extract article content from the page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractArticleContent
      });

      content = results[0].result;
    }

    if (!content || content.length < 100) {
      hideLoading();
      showStatus('No article content found on this page. Try selecting text or visit an article page.', 'error');
      button.disabled = false;
      return;
    }

    updateLoadingText('Preparing content for AI...');

    // Calculate word count and reading time
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    await sleep(300);
    updateLoadingText('AI is analyzing...');

    // Send to API with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          url: tab.url,
          summaryType
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. The article might be too long or the server is busy.');
      }
      throw fetchError;
    }

    updateLoadingText('Generating summary...');

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.summary) {
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

      summaryDiv.innerHTML = `
        <strong>Summary</strong>
        ${formatSummary(data.summary)}
        <div class="meta-info">
          <div class="meta-item">📄 ${wordCount} words</div>
          <div class="meta-item">⏱️ ~${readingTime} min read</div>
          <div class="meta-item">⚡ ${processingTime}s</div>
        </div>
      `;

      hideLoading();
      summaryDiv.classList.add('visible');
      actionsDiv.style.display = 'grid';

      // Store the last summary for copy functionality
      summaryDiv.dataset.rawSummary = data.summary;

      // Cache the summary
      await cacheSummary(tab.url, data.summary, wordCount, readingTime);
    } else {
      hideLoading();
      showStatus('Failed to generate summary. Please try again.', 'error');
    }

  } catch (error) {
    console.error('Error:', error);
    hideLoading();
    showStatus(`Error: ${error.message}`, 'error');
  }

  button.disabled = false;
});

// Format summary with better HTML rendering
function formatSummary(summary) {
  return summary
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Copy to clipboard with animation
document.getElementById('copyBtn').addEventListener('click', async () => {
  const summaryDiv = document.getElementById('summary');
  const summary = summaryDiv.dataset.rawSummary;
  const copyBtn = document.getElementById('copyBtn');
  const copyIcon = copyBtn.querySelector('.icon-copy-btn use');

  try {
    await navigator.clipboard.writeText(summary);

    // Success animation
    copyBtn.classList.add('copied');
    copyIcon.setAttribute('href', '#icon-check');

    showStatus('Copied to clipboard!', 'success');

    // Reset after animation
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyIcon.setAttribute('href', '#icon-copy');
    }, 2000);

  } catch (err) {
    showStatus('Failed to copy to clipboard', 'error');
  }
});

// Clear summary
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('summary').classList.remove('visible');
  document.getElementById('actions').style.display = 'none';
  document.getElementById('status').style.display = 'none';
  document.getElementById('contextAlert').style.display = 'none';
});

// Helper function to show status messages
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Helper function to hide status
function hideStatus() {
  document.getElementById('status').style.display = 'none';
}

// Show loading with typing animation
function showLoading(message) {
  const container = document.getElementById('loadingContainer');
  const text = document.getElementById('loadingText');
  text.textContent = message;
  container.classList.add('visible');
}

// Update loading text
function updateLoadingText(message) {
  const text = document.getElementById('loadingText');
  text.textContent = message;
}

// Hide loading
function hideLoading() {
  const container = document.getElementById('loadingContainer');
  container.classList.remove('visible');
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Cache summary
async function cacheSummary(url, summary, wordCount, readingTime) {
  try {
    const cacheEntry = {
      url,
      summary,
      wordCount,
      readingTime,
      timestamp: Date.now()
    };

    // Get existing cache
    const result = await chrome.storage.local.get(['summaryCache']);
    const cache = result.summaryCache || [];

    // Add new entry and keep last 20
    cache.unshift(cacheEntry);
    if (cache.length > 20) cache.pop();

    await chrome.storage.local.set({ summaryCache: cache });
  } catch (error) {
    console.error('Failed to cache summary:', error);
  }
}

// This function runs in the page context to extract article content
function extractArticleContent() {
  // Try multiple strategies to find article content

  // Strategy 1: Look for common article containers
  const articleSelectors = [
    'article',
    '[role="article"]',
    '[role="main"] article',
    'main article',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content-body',
    '.article-body',
    '[itemprop="articleBody"]'
  ];

  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText.trim();
      if (text.length > 200) {
        return text;
      }
    }
  }

  // Strategy 2: Look for main content area
  const mainSelectors = ['main', '[role="main"]', '#content', '#main-content'];

  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText.trim();
      if (text.length > 200) {
        return text;
      }
    }
  }

  // Strategy 3: Fallback - get all paragraph text
  const paragraphs = document.querySelectorAll('p');
  const paragraphText = Array.from(paragraphs)
    .map(p => p.innerText.trim())
    .filter(text => text.length > 50)
    .join('\n\n');

  if (paragraphText.length > 200) {
    return paragraphText;
  }

  // Strategy 4: Last resort - get body text but try to filter out navigation
  const body = document.body;
  if (body) {
    const exclude = body.querySelectorAll('nav, header, footer, aside, .sidebar, .menu');
    const originalDisplay = [];
    exclude.forEach((el, i) => {
      originalDisplay[i] = el.style.display;
      el.style.display = 'none';
    });

    const text = body.innerText.trim();

    // Restore hidden elements
    exclude.forEach((el, i) => {
      el.style.display = originalDisplay[i];
    });

    return text;
  }

  return '';
}
