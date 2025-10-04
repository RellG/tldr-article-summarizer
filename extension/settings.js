// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get(['apiUrl', 'theme', 'defaultSummaryType']);

  // Load API URL
  if (result.apiUrl) {
    document.getElementById('apiUrl').value = result.apiUrl;
  }

  // Load theme
  const theme = result.theme || 'dark';
  document.body.setAttribute('data-theme', theme);
  document.getElementById('themeSelect').value = theme;

  // Load default summary type
  const defaultSummaryType = result.defaultSummaryType || 'medium';
  document.getElementById('defaultSummaryType').value = defaultSummaryType;
});

// Save API URL
document.getElementById('saveApi').addEventListener('click', async () => {
  const apiUrl = document.getElementById('apiUrl').value.trim();

  if (!apiUrl) {
    alert('Please enter a valid API URL');
    return;
  }

  // Validate URL format
  try {
    new URL(apiUrl);
  } catch (e) {
    alert('Invalid URL format');
    return;
  }

  await chrome.storage.sync.set({ apiUrl });
  showSuccess();
});

// Theme change
document.getElementById('themeSelect').addEventListener('change', async (e) => {
  const theme = e.target.value;
  document.body.setAttribute('data-theme', theme);
  await chrome.storage.sync.set({ theme });
  showSuccess();
});

// Default summary type change
document.getElementById('defaultSummaryType').addEventListener('change', async (e) => {
  const defaultSummaryType = e.target.value;
  await chrome.storage.sync.set({ defaultSummaryType });
  showSuccess();
});

// Show success message
function showSuccess() {
  const successDiv = document.getElementById('saveSuccess');
  successDiv.style.display = 'block';
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 3000);
}
