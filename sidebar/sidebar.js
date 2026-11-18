/**
 * Ultra-lightweight Facebook Messenger Sidebar Controller
 * Features: Dedicated Messenger instance, GPU-accelerated dynamic zoom,
 * Memory Saver Engine, and Advanced AI Theming Studio with Cache-Buster Recovery.
 */

const MESSENGER_URL = 'https://www.messenger.com/';

// State
let currentZoom = 100;
let isSuspended = false;
let isThemeDrawerOpen = false;

// AI Theming State & Curated Presets
const AI_PRESETS = [
  {
    id: 'default',
    name: 'Default Modern',
    colors: {
      bgPrimary: '',
      bgSecondary: '',
      bgToolbar: '',
      borderColor: '',
      textPrimary: '',
      textSecondary: '',
      accentColor: '#0084ff',
      accentHover: '#006bce',
      glowColor: 'rgba(0, 132, 255, 0.22)',
      ambientFilter: 'none'
    },
    swatches: ['#0084ff', '#18191a', '#ffffff']
  },
  {
    id: 'cosmic',
    name: 'Cosmic Nebula',
    colors: {
      bgPrimary: '#0e0b1d',
      bgSecondary: '#181330',
      bgToolbar: 'rgba(22, 17, 44, 0.96)',
      borderColor: 'rgba(168, 85, 247, 0.25)',
      textPrimary: '#f3e8ff',
      textSecondary: '#c084fc',
      accentColor: '#a855f7',
      accentHover: '#c084fc',
      glowColor: 'rgba(168, 85, 247, 0.35)',
      ambientFilter: 'hue-rotate(250deg) saturate(1.15)'
    },
    swatches: ['#a855f7', '#0e0b1d', '#38bdf8']
  },
  {
    id: 'oled',
    name: 'Midnight OLED',
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#111111',
      bgToolbar: 'rgba(10, 10, 10, 0.98)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      textPrimary: '#ffffff',
      textSecondary: '#a3a3a3',
      accentColor: '#3b82f6',
      accentHover: '#60a5fa',
      glowColor: 'rgba(59, 130, 246, 0.25)',
      ambientFilter: 'contrast(1.08) brightness(0.96)'
    },
    swatches: ['#000000', '#ffffff', '#3b82f6']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    colors: {
      bgPrimary: '#0b0c10',
      bgSecondary: '#1f2833',
      bgToolbar: 'rgba(15, 17, 24, 0.96)',
      borderColor: 'rgba(0, 240, 255, 0.3)',
      textPrimary: '#f9f9f9',
      textSecondary: '#66fcf1',
      accentColor: '#00f0ff',
      accentHover: '#ffe600',
      glowColor: 'rgba(0, 240, 255, 0.4)',
      ambientFilter: 'hue-rotate(170deg) contrast(1.1)'
    },
    swatches: ['#00f0ff', '#ffe600', '#0b0c10']
  },
  {
    id: 'matrix',
    name: 'Emerald Matrix',
    colors: {
      bgPrimary: '#050d08',
      bgSecondary: '#0c1c11',
      bgToolbar: 'rgba(9, 23, 14, 0.96)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      textPrimary: '#ecfdf5',
      textSecondary: '#6ee7b7',
      accentColor: '#10b981',
      accentHover: '#34d399',
      glowColor: 'rgba(16, 185, 129, 0.35)',
      ambientFilter: 'hue-rotate(85deg) saturate(1.1)'
    },
    swatches: ['#10b981', '#050d08', '#6ee7b7']
  },
  {
    id: 'sunset',
    name: 'Sunset Vaporwave',
    colors: {
      bgPrimary: '#170c1e',
      bgSecondary: '#291433',
      bgToolbar: 'rgba(28, 14, 36, 0.96)',
      borderColor: 'rgba(244, 63, 94, 0.3)',
      textPrimary: '#fff1f2',
      textSecondary: '#fda4af',
      accentColor: '#f43f5e',
      accentHover: '#fb923c',
      glowColor: 'rgba(244, 63, 94, 0.35)',
      ambientFilter: 'hue-rotate(300deg) saturate(1.2)'
    },
    swatches: ['#f43f5e', '#fb923c', '#170c1e']
  },
  {
    id: 'sakura',
    name: 'Sakura Bloom',
    colors: {
      bgPrimary: '#1a1116',
      bgSecondary: '#291b23',
      bgToolbar: 'rgba(30, 20, 26, 0.96)',
      borderColor: 'rgba(244, 114, 182, 0.3)',
      textPrimary: '#fdf2f8',
      textSecondary: '#fbcfe8',
      accentColor: '#ec4899',
      accentHover: '#f472b6',
      glowColor: 'rgba(236, 72, 153, 0.35)',
      ambientFilter: 'hue-rotate(320deg) brightness(1.02)'
    },
    swatches: ['#ec4899', '#fbcfe8', '#1a1116']
  },
  {
    id: 'arctic',
    name: 'Nordic Arctic',
    colors: {
      bgPrimary: '#0a1118',
      bgSecondary: '#12202c',
      bgToolbar: 'rgba(13, 22, 32, 0.96)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
      textPrimary: '#f0f9ff',
      textSecondary: '#7dd3fc',
      accentColor: '#0ea5e9',
      accentHover: '#38bdf8',
      glowColor: 'rgba(14, 165, 233, 0.35)',
      ambientFilter: 'hue-rotate(190deg) brightness(1.05)'
    },
    swatches: ['#0ea5e9', '#7dd3fc', '#0a1118']
  },
  {
    id: 'mocha',
    name: 'Warm Espresso',
    colors: {
      bgPrimary: '#14100d',
      bgSecondary: '#211a16',
      bgToolbar: 'rgba(25, 20, 16, 0.96)',
      borderColor: 'rgba(217, 119, 6, 0.3)',
      textPrimary: '#fef3c7',
      textSecondary: '#fde68a',
      accentColor: '#d97706',
      accentHover: '#f59e0b',
      glowColor: 'rgba(217, 119, 6, 0.35)',
      ambientFilter: 'sepia(0.25) saturate(1.2)'
    },
    swatches: ['#d97706', '#f59e0b', '#14100d']
  },
  {
    id: 'amethyst',
    name: 'Royal Amethyst',
    colors: {
      bgPrimary: '#120a1f',
      bgSecondary: '#201236',
      bgToolbar: 'rgba(24, 13, 40, 0.96)',
      borderColor: 'rgba(147, 51, 234, 0.3)',
      textPrimary: '#faf5ff',
      textSecondary: '#d8b4fe',
      accentColor: '#9333ea',
      accentHover: '#c084fc',
      glowColor: 'rgba(147, 51, 234, 0.35)',
      ambientFilter: 'hue-rotate(265deg) saturate(1.2)'
    },
    swatches: ['#9333ea', '#c084fc', '#120a1f']
  }
];

let activeTheme = { ...AI_PRESETS[0] };
let ambientGlowEnabled = true;
let frameTintEnabled = false;

// DOM Elements
const frame = document.getElementById('messenger-frame');
const frameWrapper = document.getElementById('frame-wrapper');
const loader = document.getElementById('loader');
const sleepScreen = document.getElementById('sleep-screen');
const zoomIndicator = document.getElementById('zoom-indicator');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnReload = document.getElementById('btn-reload');
const btnSuspend = document.getElementById('btn-suspend');
const btnPopout = document.getElementById('btn-popout');
const btnWake = document.getElementById('btn-wake');

// AI Theming Elements
const btnAiTheme = document.getElementById('btn-ai-theme');
const aiThemeDrawer = document.getElementById('ai-theme-drawer');
const btnCloseTheme = document.getElementById('btn-close-theme');
const aiPromptInput = document.getElementById('ai-prompt-input');
const btnAiGenerate = document.getElementById('btn-ai-generate');
const themePresetsGrid = document.getElementById('theme-presets-grid');
const activeThemeNameBadge = document.getElementById('active-theme-name');
const chkAmbientGlow = document.getElementById('chk-ambient-glow');
const chkFrameTint = document.getElementById('chk-frame-tint');
const btnResetTheme = document.getElementById('btn-reset-theme');
const btnHardRefreshDirect = document.getElementById('btn-hard-refresh-direct');

/**
 * Apply Dynamic Zoom via CSS Matrix Scale & Inverse Dimensions
 */
function applyZoom(zoom) {
  currentZoom = Math.min(Math.max(zoom, 50), 160);
  const scale = currentZoom / 100;

  // Scale frame dimensions inversely so contents scale naturally
  frame.style.width = `${(100 / scale)}%`;
  frame.style.height = `${(100 / scale)}%`;
  frame.style.transform = `scale(${scale})`;
  frame.style.transformOrigin = '0 0';

  zoomIndicator.textContent = `${currentZoom}%`;
  browser.storage.local.set({ zoomLevel: currentZoom }).catch(() => {});
}

/**
 * Load Messenger into iframe with optional cache-busting
 */
function loadMessenger(forceCacheBust = false) {
  if (isSuspended) {
    wakeUp();
    return;
  }

  loader.classList.remove('hidden');

  let targetUrl = MESSENGER_URL;
  if (forceCacheBust) {
    targetUrl += `?_nc_ts=${Date.now()}`;
  }

  // Only assign if different or if forcing cache bust to avoid reload loops
  if (forceCacheBust || !frame.src || frame.src === 'about:blank' || frame.src === window.location.href) {
    frame.src = targetUrl;
  }
}

/**
 * Hard Refresh: Unloads frame completely and does a fresh bypass-cache load.
 * Fixes "This page is out of date" loops if Facebook's client cached stale chunks.
 */
function hardRefresh() {
  loader.classList.remove('hidden');
  frame.src = 'about:blank';
  setTimeout(() => {
    loadMessenger(true);
  }, 60);
}

/**
 * Suspend Iframe (Manual Sleep: drops RAM/CPU when user explicitly requests it)
 */
function suspend() {
  isSuspended = true;
  frame.src = 'about:blank';
  sleepScreen.classList.remove('hidden');
  loader.classList.add('hidden');
  btnSuspend.classList.add('active');
  btnSuspend.setAttribute('title', 'Resume Messenger (Ctrl+Alt+S)');
}

/**
 * Wake Up Iframe from Sleep Mode
 */
function wakeUp() {
  isSuspended = false;
  sleepScreen.classList.add('hidden');
  btnSuspend.classList.remove('active');
  btnSuspend.setAttribute('title', 'Suspend Messenger to save RAM (Ctrl+Alt+S)');
  loader.classList.remove('hidden');
  frame.src = MESSENGER_URL;
}

/**
 * AI Theming Engine - Semantic Palette Synthesis
 * Intelligently generates harmonious palettes based on user keywords & vibe
 */
function generateAIThemeFromPrompt(prompt) {
  if (!prompt || !prompt.trim()) return null;

  const text = prompt.toLowerCase();
  let h = 210; // Default blue hue
  let s = 80;
  let isDark = true;
  let isNeon = false;
  let title = prompt.trim();

  // Mood / Keyword Recognition
  if (text.includes('cyber') || text.includes('neon') || text.includes('2077') || text.includes('synth')) {
    h = 180; s = 100; isNeon = true;
  } else if (text.includes('purple') || text.includes('violet') || text.includes('galaxy') || text.includes('space') || text.includes('nebula')) {
    h = 275; s = 90;
  } else if (text.includes('pink') || text.includes('sakura') || text.includes('rose') || text.includes('barbie')) {
    h = 330; s = 85;
  } else if (text.includes('green') || text.includes('matrix') || text.includes('matcha') || text.includes('forest') || text.includes('emerald')) {
    h = 150; s = 85;
  } else if (text.includes('red') || text.includes('crimson') || text.includes('ruby') || text.includes('fire')) {
    h = 355; s = 90;
  } else if (text.includes('orange') || text.includes('sunset') || text.includes('amber') || text.includes('autumn')) {
    h = 25; s = 95;
  } else if (text.includes('gold') || text.includes('yellow') || text.includes('sun')) {
    h = 45; s = 95;
  } else if (text.includes('blue') || text.includes('ocean') || text.includes('ice') || text.includes('arctic')) {
    h = 205; s = 90;
  } else if (text.includes('coffee') || text.includes('mocha') || text.includes('espresso') || text.includes('brown')) {
    h = 30; s = 60;
  } else if (text.includes('oled') || text.includes('pure black') || text.includes('stealth')) {
    h = 220; s = 20; isDark = true;
  } else if (text.includes('light') || text.includes('white') || text.includes('clean') || text.includes('minimal')) {
    isDark = false;
  } else {
    // Hash-based deterministic hue generation for creative prompts
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    h = Math.abs(hash) % 360;
  }

  // Construct color variables
  let bgPrimary, bgSecondary, bgToolbar, borderColor, textPrimary, textSecondary, accentColor, accentHover, glowColor, ambientFilter;

  if (isDark) {
    const bgH = (h + 10) % 360;
    bgPrimary = text.includes('oled') ? '#000000' : `hsl(${bgH}, ${Math.min(s, 25)}%, 5%)`;
    bgSecondary = text.includes('oled') ? '#121212' : `hsl(${bgH}, ${Math.min(s, 30)}%, 9%)`;
    bgToolbar = text.includes('oled') ? 'rgba(8, 8, 8, 0.98)' : `hsla(${bgH}, ${Math.min(s, 25)}%, 7%, 0.96)`;
    borderColor = `hsla(${h}, ${s}%, 60%, 0.25)`;
    textPrimary = `hsl(${h}, 20%, 98%)`;
    textSecondary = `hsl(${h}, 30%, 75%)`;
    accentColor = `hsl(${h}, ${s}%, ${isNeon ? 55 : 60}%)`;
    accentHover = `hsl(${h}, ${s}%, ${isNeon ? 65 : 70}%)`;
    glowColor = `hsla(${h}, ${s}%, 55%, 0.35)`;
    ambientFilter = `hue-rotate(${h - 210}deg) saturate(${isNeon ? 1.3 : 1.1})`;
  } else {
    bgPrimary = `hsl(${h}, 20%, 98%)`;
    bgSecondary = `hsl(${h}, 30%, 94%)`;
    bgToolbar = `hsla(${h}, 20%, 97%, 0.96)`;
    borderColor = `hsla(${h}, ${s}%, 40%, 0.2)`;
    textPrimary = `hsl(${h}, 35%, 12%)`;
    textSecondary = `hsl(${h}, 25%, 35%)`;
    accentColor = `hsl(${h}, ${s}%, 45%)`;
    accentHover = `hsl(${h}, ${s}%, 38%)`;
    glowColor = `hsla(${h}, ${s}%, 45%, 0.25)`;
    ambientFilter = `hue-rotate(${h - 210}deg) brightness(1.02)`;
  }

  return {
    id: `ai_${Date.now()}`,
    name: title.length > 20 ? title.substring(0, 18) + '...' : title,
    isAiGenerated: true,
    colors: {
      bgPrimary,
      bgSecondary,
      bgToolbar,
      borderColor,
      textPrimary,
      textSecondary,
      accentColor,
      accentHover,
      glowColor,
      ambientFilter
    },
    swatches: [accentColor, bgPrimary, textPrimary]
  };
}

/**
 * Apply a theme to the DOM
 */
function applyTheme(theme, save = true) {
  if (!theme || !theme.colors) return;
  activeTheme = theme;

  const root = document.documentElement;
  const c = theme.colors;

  if (theme.id === 'default') {
    // Reset to default CSS properties
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--bg-toolbar');
    root.style.removeProperty('--border-color');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-secondary');
    root.style.removeProperty('--accent-color');
    root.style.removeProperty('--accent-hover');
    root.style.removeProperty('--glow-color');
    root.style.removeProperty('--ambient-filter');
  } else {
    root.style.setProperty('--bg-primary', c.bgPrimary);
    root.style.setProperty('--bg-secondary', c.bgSecondary);
    root.style.setProperty('--bg-toolbar', c.bgToolbar);
    root.style.setProperty('--border-color', c.borderColor);
    root.style.setProperty('--text-primary', c.textPrimary);
    root.style.setProperty('--text-secondary', c.textSecondary);
    root.style.setProperty('--accent-color', c.accentColor);
    root.style.setProperty('--accent-hover', c.accentHover);
    root.style.setProperty('--glow-color', c.glowColor);
    root.style.setProperty('--ambient-filter', c.ambientFilter || 'none');
  }

  // Update Ambient Aura
  if (ambientGlowEnabled && theme.id !== 'default') {
    frameWrapper.classList.add('has-glow');
  } else {
    frameWrapper.classList.remove('has-glow');
  }

  if (frameTintEnabled && c.ambientFilter && theme.id !== 'default') {
    frameWrapper.classList.add('has-tint');
  } else {
    frameWrapper.classList.remove('has-tint');
  }

  if (activeThemeNameBadge) {
    activeThemeNameBadge.textContent = theme.name;
  }

  renderPresetCards();

  if (save) {
    browser.storage.local.set({
      aiThemeConfig: {
        activeTheme,
        ambientGlowEnabled,
        frameTintEnabled
      }
    }).catch(() => {});
  }
}

/**
 * Render Preset Cards in the Studio Grid
 */
function renderPresetCards() {
  if (!themePresetsGrid) return;
  themePresetsGrid.innerHTML = '';

  AI_PRESETS.forEach(preset => {
    const card = document.createElement('div');
    card.className = `theme-card ${activeTheme.id === preset.id ? 'active' : ''}`;
    card.dataset.id = preset.id;

    const top = document.createElement('div');
    top.className = 'theme-card-top';

    const name = document.createElement('span');
    name.className = 'theme-card-name';
    name.textContent = preset.name;
    top.appendChild(name);

    const swatches = document.createElement('div');
    swatches.className = 'theme-swatches';
    preset.swatches.forEach(swatchHex => {
      const dot = document.createElement('span');
      dot.className = 'swatch';
      dot.style.backgroundColor = swatchHex;
      swatches.appendChild(dot);
    });
    top.appendChild(swatches);

    card.appendChild(top);

    card.addEventListener('click', () => {
      applyTheme(preset);
    });

    themePresetsGrid.appendChild(card);
  });
}

/**
 * Toggle AI Theme Drawer
 */
function toggleThemeDrawer(open) {
  isThemeDrawerOpen = open !== undefined ? open : !isThemeDrawerOpen;
  if (isThemeDrawerOpen) {
    aiThemeDrawer.classList.remove('hidden');
    btnAiTheme.classList.add('active');
    setTimeout(() => aiPromptInput.focus(), 100);
  } else {
    aiThemeDrawer.classList.add('hidden');
    btnAiTheme.classList.remove('active');
  }
}

/**
 * Initialize Event Listeners
 */
function initEvents() {
  // Zoom In / Out / Reset
  btnZoomIn.addEventListener('click', () => applyZoom(currentZoom + 10));
  btnZoomOut.addEventListener('click', () => applyZoom(currentZoom - 10));
  zoomIndicator.addEventListener('click', () => applyZoom(100));

  // Reload: Click = Standard Reload | Shift+Click = Hard Refresh with Cache-Buster
  btnReload.addEventListener('click', (e) => {
    if (isSuspended) {
      wakeUp();
    } else {
      if (e.shiftKey) {
        hardRefresh();
      } else {
        loader.classList.remove('hidden');
        try {
          frame.contentWindow.location.reload();
        } catch (err) {
          // Cross-origin fallback
          frame.src = MESSENGER_URL;
        }
      }
    }
  });

  // Suspend Toggle (Manual Only)
  btnSuspend.addEventListener('click', () => {
    if (isSuspended) {
      wakeUp();
    } else {
      suspend();
    }
  });

  // Wake Button on sleep screen
  btnWake.addEventListener('click', wakeUp);

  // Popout to Standalone Window
  btnPopout.addEventListener('click', () => {
    browser.runtime.sendMessage({
      action: 'openPopout',
      url: MESSENGER_URL
    }).catch(() => {});
  });

  // AI Theming Drawer Toggles
  btnAiTheme.addEventListener('click', () => toggleThemeDrawer());
  btnCloseTheme.addEventListener('click', () => toggleThemeDrawer(false));

  // AI Prompt Generate Button
  btnAiGenerate.addEventListener('click', () => {
    const prompt = aiPromptInput.value.trim();
    if (prompt) {
      const generated = generateAIThemeFromPrompt(prompt);
      if (generated) {
        applyTheme(generated);
      }
    }
  });

  aiPromptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnAiGenerate.click();
    }
  });

  // Ambient Toggles
  chkAmbientGlow.addEventListener('change', (e) => {
    ambientGlowEnabled = e.target.checked;
    applyTheme(activeTheme);
  });

  chkFrameTint.addEventListener('change', (e) => {
    frameTintEnabled = e.target.checked;
    applyTheme(activeTheme);
  });

  // Reset Theme
  btnResetTheme.addEventListener('click', () => {
    applyTheme(AI_PRESETS[0]);
    aiPromptInput.value = '';
  });

  // Hard Refresh Button inside Drawer
  btnHardRefreshDirect.addEventListener('click', () => {
    hardRefresh();
    toggleThemeDrawer(false);
  });

  // Iframe Load Completed
  frame.addEventListener('load', () => {
    if (frame.src && frame.src !== 'about:blank') {
      loader.classList.add('hidden');
    }
  });

  // Global Keyboard Shortcuts inside sidebar
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        applyZoom(currentZoom + 10);
      } else if (e.key === '-') {
        e.preventDefault();
        applyZoom(currentZoom - 10);
      } else if (e.key === '0') {
        e.preventDefault();
        applyZoom(100);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (e.shiftKey) {
          hardRefresh();
        } else {
          btnReload.click();
        }
      }
    }
  });

  // Listen for messages from background (e.g. shortcut commands)
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'command_toggle_suspend') {
      if (isSuspended) {
        wakeUp();
      } else {
        suspend();
      }
    } else if (message.action === 'command_toggle_ai_theme') {
      toggleThemeDrawer();
    }
  });
}

/**
 * Initialize Sidebar
 */
async function init() {
  try {
    const stored = await browser.storage.local.get(['zoomLevel', 'aiThemeConfig']);
    if (stored.zoomLevel) currentZoom = stored.zoomLevel;
    if (stored.aiThemeConfig) {
      if (stored.aiThemeConfig.activeTheme) activeTheme = stored.aiThemeConfig.activeTheme;
      if (stored.aiThemeConfig.ambientGlowEnabled !== undefined) ambientGlowEnabled = stored.aiThemeConfig.ambientGlowEnabled;
      if (stored.aiThemeConfig.frameTintEnabled !== undefined) frameTintEnabled = stored.aiThemeConfig.frameTintEnabled;
      chkAmbientGlow.checked = ambientGlowEnabled;
      chkFrameTint.checked = frameTintEnabled;
    }
  } catch (e) {
    console.warn('Could not read storage preferences', e);
  }

  initEvents();
  renderPresetCards();
  applyTheme(activeTheme, false);
  applyZoom(currentZoom);
  loadMessenger();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
