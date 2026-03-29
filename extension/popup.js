// TL;DR v3.0 — Obsidian Reader
// Production API URL
const API_URL = 'https://tldr-article-summarizer-production.up.railway.app/api/summarize';

// ── State ──────────────────────────────
let contextMenuData = null;
let timerInterval = null;
let timerStart = 0;

// ── Initialize ─────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get(['theme', 'colorScheme', 'defaultSummaryType']);

  // Theme
  const theme = result.theme || 'dark';
  document.body.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  // Color scheme
  const colorScheme = result.colorScheme || 'purple';
  document.body.setAttribute('data-color', colorScheme);

  // Default summary type
  document.getElementById('summaryType').value = result.defaultSummaryType || 'medium';

  // Check context menu action
  await checkContextMenuAction();
});

// ── Context Menu ───────────────────────
async function checkContextMenuAction() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getContextMenuAction' });
    if (response && response.text) {
      contextMenuData = response;
      const alert = document.getElementById('contextAlert');
      document.getElementById('contextAlertText').textContent = 'Ready to summarize selection';
      alert.style.display = 'flex';
      setTimeout(() => document.getElementById('summarizeBtn').click(), 600);
      await chrome.storage.local.remove('contextMenuAction');
    }
  } catch (e) {
    // No context menu action pending
  }
}

// ── Theme Toggle ───────────────────────
document.getElementById('themeToggle').addEventListener('click', async () => {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  await chrome.storage.sync.set({ theme: next });
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  document.querySelector('#themeToggle .icon use')
    .setAttribute('href', theme === 'dark' ? '#icon-sun' : '#icon-moon');
}

// ── Elapsed Timer ──────────────────────
function startTimer() {
  timerStart = Date.now();
  const el = document.getElementById('elapsedTimer');
  el.textContent = '0.0s';
  timerInterval = setInterval(() => {
    el.textContent = ((Date.now() - timerStart) / 1000).toFixed(1) + 's';
  }, 100);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// ── Loading Helpers ────────────────────
function showLoading(msg) {
  hideEmptyState();
  const c = document.getElementById('loadingContainer');
  document.getElementById('loadingText').textContent = msg;
  document.getElementById('elapsedTimer').textContent = '0.0s';
  c.style.display = 'flex';
  startTimer();
}

function updateLoadingText(msg) {
  document.getElementById('loadingText').textContent = msg;
}

function hideLoading() {
  document.getElementById('loadingContainer').style.display = 'none';
  stopTimer();
}

// ── Status Helpers ─────────────────────
function showStatus(message, type) {
  const el = document.getElementById('status');
  const textEl = document.getElementById('statusText');
  const retryEl = document.getElementById('retryBtn');

  textEl.textContent = message;
  el.className = 'status-msg ' + type;
  el.style.display = 'flex';
  retryEl.style.display = type === 'error' ? 'inline-flex' : 'none';

  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
}

function hideStatus() {
  document.getElementById('status').style.display = 'none';
  document.getElementById('retryBtn').style.display = 'none';
}

// ── Empty State ────────────────────────
function showEmptyState() {
  document.getElementById('emptyState').style.display = 'flex';
}

function hideEmptyState() {
  document.getElementById('emptyState').style.display = 'none';
}

// ── Main Summarize ─────────────────────
document.getElementById('summarizeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('summarizeBtn');
  const summaryDiv = document.getElementById('summary');
  const actionsDiv = document.getElementById('actions');
  const summaryType = document.getElementById('summaryType').value;
  const startTime = Date.now();

  btn.disabled = true;
  summaryDiv.style.display = 'none';
  actionsDiv.style.display = 'none';
  hideStatus();
  showLoading('Analyzing article...');

  try {
    let content, tab;

    if (contextMenuData && contextMenuData.text) {
      content = contextMenuData.text;
      contextMenuData = null;
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];
    } else {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractArticleContent
      });
      content = results[0].result;
    }

    if (!content || content.length < 100) {
      hideLoading();
      showStatus('Not enough content found. If this page is paywalled or requires login, try selecting the article text and right-clicking instead.', 'error');
      btn.disabled = false;
      return;
    }

    updateLoadingText('AI is summarizing...');

    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    const focus = document.getElementById('focusInput').value.trim();

    // API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, url: tab.url, summaryType, focus }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        throw new Error('Request timed out. The article might be too long or the server is busy.');
      }
      throw fetchErr;
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `API error: ${response.status}`);
    }

    // Begin streaming display
    hideLoading();
    summaryDiv.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'summary-label';
    label.innerHTML = '<svg class="icon-sm"><use href="#icon-sparkles"></use></svg> Summary';
    const textDiv = document.createElement('div');
    textDiv.className = 'summary-text';
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    textDiv.appendChild(cursor);
    summaryDiv.appendChild(label);
    summaryDiv.appendChild(textDiv);
    summaryDiv.style.display = 'block';

    // Read stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';
    let fullSummary = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.done || !parsed.content) continue;
          fullSummary += parsed.content;
          cursor.remove();
          textDiv.innerHTML = formatSummary(fullSummary);
          textDiv.appendChild(cursor);
        } catch (e) {}
      }
    }

    if (!fullSummary) {
      summaryDiv.style.display = 'none';
      showStatus('Failed to generate summary. Please try again.', 'error');
    } else {
      cursor.remove();
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      const metaDiv = document.createElement('div');
      metaDiv.className = 'meta-info';
      metaDiv.innerHTML = `
        <div class="meta-item">
          <svg class="icon-xs"><use href="#icon-document"></use></svg>
          ${wordCount.toLocaleString()} words
        </div>
        <div class="meta-item">
          <svg class="icon-xs"><use href="#icon-clock"></use></svg>
          ~${readingTime} min read
        </div>
        <div class="meta-item">
          <svg class="icon-xs"><use href="#icon-zap"></use></svg>
          ${processingTime}s
        </div>
      `;
      metaDiv.style.opacity = '0';
      summaryDiv.appendChild(metaDiv);
      setTimeout(() => { metaDiv.style.transition = 'opacity .4s ease'; metaDiv.style.opacity = '1'; }, 50);
      actionsDiv.style.display = 'grid';
      summaryDiv.dataset.rawSummary = fullSummary;
      await cacheSummary(tab.url, fullSummary, wordCount, readingTime);
    }

  } catch (error) {
    console.error('Error:', error);
    hideLoading();
    showStatus(error.message, 'error');
  }

  btn.disabled = false;
});

// ── Retry ──────────────────────────────
document.getElementById('retryBtn').addEventListener('click', () => {
  hideStatus();
  document.getElementById('summarizeBtn').click();
});

// ── Format Summary ─────────────────────
function formatSummary(summary) {
  return escapeHtml(summary)
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// ── Copy ───────────────────────────────
document.getElementById('copyBtn').addEventListener('click', async () => {
  const raw = document.getElementById('summary').dataset.rawSummary;
  const btn = document.getElementById('copyBtn');
  const iconUse = btn.querySelector('.icon-copy-ref use');

  try {
    await navigator.clipboard.writeText(raw);
    btn.classList.add('copied');
    iconUse.setAttribute('href', '#icon-check');
    showStatus('Copied to clipboard!', 'success');
    setTimeout(() => {
      btn.classList.remove('copied');
      iconUse.setAttribute('href', '#icon-copy');
    }, 2000);
  } catch (err) {
    showStatus('Failed to copy to clipboard', 'error');
  }
});

// ── Clear ──────────────────────────────
document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('summary').style.display = 'none';
  document.getElementById('actions').style.display = 'none';
  document.getElementById('contextAlert').style.display = 'none';
  hideStatus();
  showEmptyState();
});

// ── History Drawer ─────────────────────
document.getElementById('historyToggle').addEventListener('click', () => {
  openHistory();
});

document.getElementById('historyClose').addEventListener('click', () => {
  closeHistory();
});

document.getElementById('historyOverlay').addEventListener('click', () => {
  closeHistory();
});

document.getElementById('historyClear').addEventListener('click', async () => {
  await chrome.storage.local.set({ summaryCache: [] });
  renderHistory([]);
});

function openHistory() {
  document.getElementById('historyDrawer').classList.add('open');
  document.getElementById('historyOverlay').classList.add('open');
  loadHistory();
}

function closeHistory() {
  document.getElementById('historyDrawer').classList.remove('open');
  document.getElementById('historyOverlay').classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('historyDrawer').classList.contains('open')) {
    closeHistory();
  }
});

async function loadHistory() {
  const result = await chrome.storage.local.get(['summaryCache']);
  renderHistory(result.summaryCache || []);
}

function renderHistory(cache) {
  const listEl = document.getElementById('historyList');
  const emptyEl = document.getElementById('historyEmpty');

  if (!cache.length) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = cache.map((entry, i) => {
    const domain = extractDomain(entry.url);
    const preview = entry.summary.substring(0, 120) + (entry.summary.length > 120 ? '...' : '');
    const ago = timeAgo(entry.timestamp);
    return `
      <div class="history-item" data-idx="${i}" tabindex="0" role="button">
        <div class="history-item-domain">${escapeHtml(domain)}</div>
        <div class="history-item-preview">${escapeHtml(preview)}</div>
        <div class="history-item-meta">
          <span>${entry.wordCount?.toLocaleString() || '?'} words</span>
          <span>${ago}</span>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.history-item').forEach(el => {
    const handler = () => {
      const idx = parseInt(el.dataset.idx);
      loadHistorySummary(cache[idx]);
    };
    el.addEventListener('click', handler);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}

function loadHistorySummary(entry) {
  hideEmptyState();
  hideStatus();
  const summaryDiv = document.getElementById('summary');
  const actionsDiv = document.getElementById('actions');

  const metaHtml = `
    <div class="meta-item">
      <svg class="icon-xs"><use href="#icon-document"></use></svg>
      ${(entry.wordCount || 0).toLocaleString()} words
    </div>
    <div class="meta-item">
      <svg class="icon-xs"><use href="#icon-clock"></use></svg>
      ~${entry.readingTime || '?'} min read
    </div>
  `;

  summaryDiv.innerHTML = '';
  const label = document.createElement('div');
  label.className = 'summary-label';
  label.innerHTML = '<svg class="icon-sm"><use href="#icon-sparkles"></use></svg> Summary';

  const textDiv = document.createElement('div');
  textDiv.className = 'summary-text';
  textDiv.innerHTML = formatSummary(entry.summary);

  const metaDiv = document.createElement('div');
  metaDiv.className = 'meta-info';
  metaDiv.innerHTML = metaHtml;

  summaryDiv.appendChild(label);
  summaryDiv.appendChild(textDiv);
  summaryDiv.appendChild(metaDiv);
  summaryDiv.dataset.rawSummary = entry.summary;
  summaryDiv.style.display = 'block';
  actionsDiv.style.display = 'grid';

  closeHistory();
}

// ── Utilities ──────────────────────────
function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return 'unknown'; }
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Cache ──────────────────────────────
async function cacheSummary(url, summary, wordCount, readingTime) {
  try {
    const entry = { url, summary, wordCount, readingTime, timestamp: Date.now() };
    const result = await chrome.storage.local.get(['summaryCache']);
    const cache = result.summaryCache || [];
    cache.unshift(entry);
    if (cache.length > 20) cache.pop();
    await chrome.storage.local.set({ summaryCache: cache });
  } catch (e) {
    console.error('Cache error:', e);
  }
}

// ── Content Extraction ─────────────────
function extractArticleContent() {
  const articleSelectors = [
    'article', '[role="article"]', '[role="main"] article', 'main article',
    '.article-content', '.post-content', '.entry-content', '.content-body',
    '.article-body', '[itemprop="articleBody"]'
  ];

  for (const sel of articleSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const t = el.innerText.trim();
      if (t.length > 200) return t;
    }
  }

  const mainSelectors = ['main', '[role="main"]', '#content', '#main-content'];
  for (const sel of mainSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const t = el.innerText.trim();
      if (t.length > 200) return t;
    }
  }

  const paragraphs = document.querySelectorAll('p');
  const pText = Array.from(paragraphs)
    .map(p => p.innerText.trim())
    .filter(t => t.length > 50)
    .join('\n\n');
  if (pText.length > 200) return pText;

  const body = document.body;
  if (body) {
    const exclude = body.querySelectorAll('nav, header, footer, aside, .sidebar, .menu');
    const saved = [];
    exclude.forEach((el, i) => { saved[i] = el.style.display; el.style.display = 'none'; });
    const text = body.innerText.trim();
    exclude.forEach((el, i) => { el.style.display = saved[i]; });
    return text;
  }

  return '';
}
