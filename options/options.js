/**
 * Messenger Sidebar - Options Controller
 */

const zoomRange = document.getElementById('default-zoom');
const zoomVal = document.getElementById('zoom-val');
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
    zoomLevel: 100
  };

  const stored = await browser.storage.local.get(defaults);
  zoomRange.value = stored.zoomLevel || defaults.zoomLevel;
  zoomVal.textContent = `${zoomRange.value}%`;
}

// Save settings to storage
function saveSettings() {
  const data = {
    zoomLevel: parseInt(zoomRange.value, 10)
  };

  browser.storage.local.set(data).then(() => {
    showSaved();
  });
}

zoomRange.addEventListener('input', (e) => {
  zoomVal.textContent = `${e.target.value}%`;
});

zoomRange.addEventListener('change', saveSettings);

document.addEventListener('DOMContentLoaded', loadSettings);
