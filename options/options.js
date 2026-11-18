/**
 * Messenger Sidebar - Options Controller
 * Handles service endpoints, layout modes, aesthetics, and cache recovery.
 */

const selectServiceUrl = document.getElementById('select-service-url');
const chkDefaultDesktop = document.getElementById('chk-default-desktop');
const zoomRange = document.getElementById('default-zoom');
const zoomVal = document.getElementById('zoom-val');
const statusMsg = document.getElementById('save-status');
const optChkGlow = document.getElementById('opt-chk-glow');
const optChkTint = document.getElementById('opt-chk-tint');
const btnClearCache = document.getElementById('btn-clear-cache');

let saveTimeout = null;

function showSaved(text = 'Settings saved automatically') {
  statusMsg.textContent = text;
  statusMsg.classList.add('visible');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    statusMsg.classList.remove('visible');
  }, 2200);
}

// Load saved settings
async function loadSettings() {
  const defaults = {
    zoomLevel: 100,
    serviceUrl: 'https://www.facebook.com/messages/t/',
    desktopMode: false,
    aiThemeConfig: {
      ambientGlowEnabled: true,
      frameTintEnabled: false
    }
  };

  const stored = await browser.storage.local.get(defaults);
  zoomRange.value = stored.zoomLevel || defaults.zoomLevel;
  zoomVal.textContent = `${zoomRange.value}%`;

  if (selectServiceUrl && stored.serviceUrl) {
    selectServiceUrl.value = stored.serviceUrl;
  }

  if (chkDefaultDesktop) {
    chkDefaultDesktop.checked = stored.desktopMode || false;
  }

  if (stored.aiThemeConfig) {
    if (stored.aiThemeConfig.ambientGlowEnabled !== undefined) {
      optChkGlow.checked = stored.aiThemeConfig.ambientGlowEnabled;
    }
    if (stored.aiThemeConfig.frameTintEnabled !== undefined) {
      optChkTint.checked = stored.aiThemeConfig.frameTintEnabled;
    }
  }
}

// Save Zoom
function saveZoom() {
  const data = {
    zoomLevel: parseInt(zoomRange.value, 10)
  };
  browser.storage.local.set(data).then(() => {
    showSaved('Default zoom level updated');
  });
}

zoomRange.addEventListener('input', (e) => {
  zoomVal.textContent = `${e.target.value}%`;
});
zoomRange.addEventListener('change', saveZoom);

if (selectServiceUrl) {
  selectServiceUrl.addEventListener('change', async (e) => {
    await browser.storage.local.set({ serviceUrl: e.target.value });
    showSaved(`Active service set to: ${e.target.options[e.target.selectedIndex].text}`);
  });
}

if (chkDefaultDesktop) {
  chkDefaultDesktop.addEventListener('change', async (e) => {
    await browser.storage.local.set({ desktopMode: e.target.checked });
    showSaved(e.target.checked ? 'Default layout set to Desktop 3-Column View' : 'Default layout set to Compact View');
  });
}

function saveAestheticSettings() {
  browser.storage.local.set({
    aiThemeConfig: {
      ambientGlowEnabled: optChkGlow.checked,
      frameTintEnabled: optChkTint.checked
    }
  }).then(() => {
    showSaved('Appearance updated');
  });
}

optChkGlow.addEventListener('change', saveAestheticSettings);
optChkTint.addEventListener('change', saveAestheticSettings);

// Clear Cache & Reset Service Workers
btnClearCache.addEventListener('click', async () => {
  try {
    await browser.runtime.sendMessage({ action: 'clearCache' });
    showSaved('✓ Disk cache & stale service workers wiped! Re-opening the sidebar will fetch fresh files.');
  } catch (e) {
    showSaved('Failed to clear cache: ' + e.message);
  }
});

document.addEventListener('DOMContentLoaded', loadSettings);
