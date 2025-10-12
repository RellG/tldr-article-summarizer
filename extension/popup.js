// Production API URL
const API_URL = 'https://api.terravirtual.cfd/api/summarize';

// Load saved configuration on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get(['theme', 'defaultSummaryType']);

  // Load theme preference
  const theme = result.theme || 'dark';
  document.body.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  // Load default summary type
  const defaultSummaryType = result.defaultSummaryType || 'medium';
  document.getElementById('summaryType').value = defaultSummaryType;
});

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', async () => {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.body.setAttribute('data-theme', newTheme);
  await chrome.storage.sync.set({ theme: newTheme });
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  icon.textContent = theme === 'dark' ? '☀️' : '🌙';
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
  showProgress(20, 'Extracting article content...');

  try {
    // Get the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Extract article content from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractArticleContent
    });

    const content = results[0].result;

    if (!content || content.length < 100) {
      hideProgress();
      showStatus('No article content found on this page. Try a different page with more text.', 'error');
      button.disabled = false;
      return;
    }

    showProgress(40, 'Preparing content for AI...');

    // Calculate word count and reading time
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute

    await sleep(300); // Brief pause for UX
    showProgress(60, 'AI is analyzing...');

    // Send to API with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

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

    showProgress(90, 'Generating summary...');

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.summary) {
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

      summaryDiv.innerHTML = `
        <strong>Summary:</strong><br>
        ${formatSummary(data.summary)}
        <div class="meta-info">
          <div class="meta-item">📄 ${wordCount} words</div>
          <div class="meta-item">⏱️ ~${readingTime} min read</div>
          <div class="meta-item">⚡ ${processingTime}s</div>
        </div>
      `;

      showProgress(100, 'Complete!');
      await sleep(500);
      hideProgress();

      summaryDiv.classList.add('visible');
      actionsDiv.style.display = 'block';

      // Store the last summary for copy functionality and caching
      summaryDiv.dataset.rawSummary = data.summary;

      // Cache the summary
      await cacheSummary(tab.url, data.summary, wordCount, readingTime);
    } else {
      hideProgress();
      showStatus('Failed to generate summary. Please try again.', 'error');
    }

  } catch (error) {
    console.error('Error:', error);
    hideProgress();
    showStatus(`Error: ${error.message}`, 'error');
  }

  button.disabled = false;
});

// Copy to clipboard
document.getElementById('copyBtn').addEventListener('click', () => {
  const summaryDiv = document.getElementById('summary');
  const summary = summaryDiv.dataset.rawSummary;

  navigator.clipboard.writeText(summary).then(() => {
    showStatus('Copied to clipboard!', 'success');
  }).catch(err => {
    showStatus('Failed to copy to clipboard', 'error');
  });
});

// Clear summary
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('summary').classList.remove('visible');
  document.getElementById('actions').style.display = 'none';
  document.getElementById('status').style.display = 'none';
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

// Helper function to show progress
function showProgress(percentage, message) {
  const container = document.getElementById('progressContainer');
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');

  container.classList.add('visible');
  fill.style.width = `${percentage}%`;
  text.textContent = message;
}

// Helper function to hide progress
function hideProgress() {
  const container = document.getElementById('progressContainer');
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

// Format summary with better HTML rendering
function formatSummary(summary) {
  // Convert markdown-style bullet points to HTML
  return summary
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
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
    .filter(text => text.length > 50) // Filter out short paragraphs
    .join('\n\n');

  if (paragraphText.length > 200) {
    return paragraphText;
  }

  // Strategy 4: Last resort - get body text but try to filter out navigation
  const body = document.body;
  if (body) {
    // Remove nav, header, footer, aside elements temporarily
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