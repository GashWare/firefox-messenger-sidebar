/**
 * Messenger Sidebar - Options Controller
 * Includes AI Theming synchronization and cache management.
 */

const AI_PRESETS = [
  { id: 'default', name: 'Default Modern', swatches: ['#0084ff', '#18191a'] },
  { id: 'cosmic', name: 'Cosmic Nebula', swatches: ['#a855f7', '#0e0b1d'] },
  { id: 'oled', name: 'Midnight OLED', swatches: ['#000000', '#ffffff'] },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', swatches: ['#00f0ff', '#ffe600'] },
  { id: 'matrix', name: 'Emerald Matrix', swatches: ['#10b981', '#050d08'] },
  { id: 'sunset', name: 'Sunset Vaporwave', swatches: ['#f43f5e', '#fb923c'] },
  { id: 'sakura', name: 'Sakura Bloom', swatches: ['#ec4899', '#fbcfe8'] },
  { id: 'arctic', name: 'Nordic Arctic', swatches: ['#0ea5e9', '#7dd3fc'] },
  { id: 'mocha', name: 'Warm Espresso', swatches: ['#d97706', '#f59e0b'] },
  { id: 'amethyst', name: 'Royal Amethyst', swatches: ['#9333ea', '#c084fc'] }
];

const zoomRange = document.getElementById('default-zoom');
const zoomVal = document.getElementById('zoom-val');
const statusMsg = document.getElementById('save-status');
const optActiveThemeBadge = document.getElementById('opt-active-theme');
const optAiPrompt = document.getElementById('opt-ai-prompt');
const optBtnGenerate = document.getElementById('opt-btn-generate');
const optPresetsGrid = document.getElementById('opt-presets-grid');
const optChkGlow = document.getElementById('opt-chk-glow');
const optChkTint = document.getElementById('opt-chk-tint');
const btnClearCache = document.getElementById('btn-clear-cache');

let currentActiveThemeId = 'default';
let saveTimeout = null;

function showSaved(text = 'Settings saved automatically') {
  statusMsg.textContent = text;
  statusMsg.classList.add('visible');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    statusMsg.classList.remove('visible');
  }, 1800);
}

// Render Presets
function renderOptionsPresets() {
  if (!optPresetsGrid) return;
  optPresetsGrid.innerHTML = '';

  AI_PRESETS.forEach(p => {
    const chip = document.createElement('div');
    chip.className = `preset-chip ${currentActiveThemeId === p.id ? 'active' : ''}`;
    chip.dataset.id = p.id;

    const label = document.createElement('span');
    label.textContent = p.name;
    chip.appendChild(label);

    const swatch = document.createElement('span');
    swatch.className = 'chip-swatch';
    swatch.style.backgroundColor = p.swatches[0];
    chip.appendChild(swatch);

    chip.addEventListener('click', () => {
      currentActiveThemeId = p.id;
      optActiveThemeBadge.textContent = p.name;
      saveThemeSelection(p.id, p.name);
      renderOptionsPresets();
    });

    optPresetsGrid.appendChild(chip);
  });
}

// Save Theme Selection
async function saveThemeSelection(themeId, themeName) {
  const stored = await browser.storage.local.get(['aiThemeConfig']);
  const currentConfig = stored.aiThemeConfig || {};

  currentConfig.activeTheme = {
    id: themeId,
    name: themeName
  };
  currentConfig.ambientGlowEnabled = optChkGlow.checked;
  currentConfig.frameTintEnabled = optChkTint.checked;

  await browser.storage.local.set({ aiThemeConfig: currentConfig });
  showSaved(`Applied theme: ${themeName}`);
}

// Load saved settings
async function loadSettings() {
  const defaults = {
    zoomLevel: 100,
    aiThemeConfig: {
      activeTheme: { id: 'default', name: 'Default Modern' },
      ambientGlowEnabled: true,
      frameTintEnabled: false
    }
  };

  const stored = await browser.storage.local.get(defaults);
  zoomRange.value = stored.zoomLevel || defaults.zoomLevel;
  zoomVal.textContent = `${zoomRange.value}%`;

  if (stored.aiThemeConfig) {
    if (stored.aiThemeConfig.activeTheme) {
      currentActiveThemeId = stored.aiThemeConfig.activeTheme.id || 'default';
      optActiveThemeBadge.textContent = stored.aiThemeConfig.activeTheme.name || 'Default Modern';
    }
    if (stored.aiThemeConfig.ambientGlowEnabled !== undefined) {
      optChkGlow.checked = stored.aiThemeConfig.ambientGlowEnabled;
    }
    if (stored.aiThemeConfig.frameTintEnabled !== undefined) {
      optChkTint.checked = stored.aiThemeConfig.frameTintEnabled;
    }
  }

  renderOptionsPresets();
}

// Save Zoom
function saveZoom() {
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
zoomRange.addEventListener('change', saveZoom);

optChkGlow.addEventListener('change', () => {
  saveThemeSelection(currentActiveThemeId, optActiveThemeBadge.textContent);
});

optChkTint.addEventListener('change', () => {
  saveThemeSelection(currentActiveThemeId, optActiveThemeBadge.textContent);
});

// Prompt Generate in options
optBtnGenerate.addEventListener('click', () => {
  const prompt = optAiPrompt.value.trim();
  if (prompt) {
    currentActiveThemeId = `ai_custom`;
    optActiveThemeBadge.textContent = prompt;
    saveThemeSelection('ai_custom', prompt);
    renderOptionsPresets();
  }
});

// Clear Cache Button
btnClearCache.addEventListener('click', async () => {
  await browser.storage.local.set({ forceNextCacheBust: Date.now() });
  showSaved('Cache flag reset! Re-opening the sidebar will bypass all cache.');
});

document.addEventListener('DOMContentLoaded', loadSettings);
