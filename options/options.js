/**
 * Messenger Sidebar - Options Controller
 */

const zoomRange = document.getElementById('default-zoom');
const zoomVal = document.getElementById('zoom-val');
const sleepSelect = document.getElementById('sleep-timeout');
const statusMsg = document.getElementById('save-status');

let saveTimeout = null;

function showSaved() {
  statusMsg.classList.add('visible');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    statusMsg.classList.remove('visible');
  }, 1800);
}

// Load saved settings
async function loadSettings() {
  const defaults = {
    zoomLevel: 100,
    autoSleepMinutes: 15
  };

  const stored = await browser.storage.local.get(defaults);
  zoomRange.value = stored.zoomLevel || defaults.zoomLevel;
  zoomVal.textContent = `${zoomRange.value}%`;
  sleepSelect.value = stored.autoSleepMinutes !== undefined ? String(stored.autoSleepMinutes) : '15';
}

// Save settings to storage
function saveSettings() {
  const data = {
    zoomLevel: parseInt(zoomRange.value, 10),
    autoSleepMinutes: parseInt(sleepSelect.value, 10)
  };

  browser.storage.local.set(data).then(() => {
    showSaved();
  });
}

sleepSelect.addEventListener('change', saveSettings);

zoomRange.addEventListener('input', (e) => {
  zoomVal.textContent = `${e.target.value}%`;
});

zoomRange.addEventListener('change', saveSettings);

document.addEventListener('DOMContentLoaded', loadSettings);
