// Load settings on page load
document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get(['theme', 'colorScheme', 'defaultSummaryType']);

  // Load theme
  const theme = result.theme || 'dark';
  document.body.setAttribute('data-theme', theme);
  document.getElementById('themeSelect').value = theme;

  // Load color scheme
  const colorScheme = result.colorScheme || 'purple';
  document.body.setAttribute('data-color', colorScheme);
  document.getElementById('colorSelect').value = colorScheme;

  // Load default summary type
  const defaultSummaryType = result.defaultSummaryType || 'medium';
  document.getElementById('defaultSummaryType').value = defaultSummaryType;
});

// Theme change
document.getElementById('themeSelect').addEventListener('change', async (e) => {
  const theme = e.target.value;
  document.body.setAttribute('data-theme', theme);
  await chrome.storage.sync.set({ theme });
  showSuccess();
});

// Color scheme change (NEW)
document.getElementById('colorSelect').addEventListener('change', async (e) => {
  const colorScheme = e.target.value;
  document.body.setAttribute('data-color', colorScheme);
  await chrome.storage.sync.set({ colorScheme });
  showSuccess();
});

// Default summary type change
document.getElementById('defaultSummaryType').addEventListener('change', async (e) => {
  const defaultSummaryType = e.target.value;
  await chrome.storage.sync.set({ defaultSummaryType });
  showSuccess();
});

// Show success message with animation
function showSuccess() {
  const successDiv = document.getElementById('saveSuccess');
  successDiv.classList.add('visible');

  setTimeout(() => {
    successDiv.classList.remove('visible');
  }, 3000);
}
