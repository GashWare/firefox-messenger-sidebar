/**
 * Facebook Messenger Sidebar Controller
 * Features:
 * - Dual Service Mode: Native Facebook Messages (facebook.com/messages/t/) & Messenger.com
 * - Desktop 3-Column Mode: Forces Facebook to display Chat Details & Change Theme side-by-side
 * - High-Verbosity Diagnostic Engine with live in-UI log console & one-click copy
 * - Total Cookie Protection Session Restorer & Hard Cache Recovery
 * - GPU-accelerated dynamic zoom (40% - 160%) & Memory Saver
 */

const FB_MESSAGES_URL = 'https://www.facebook.com/messages/t/';
const MESSENGER_URL = 'https://www.messenger.com/';

// State
let currentZoom = 100;
let isSuspended = false;
let isDrawerOpen = false;
let isDesktopMode = false;
let currentTab = 'themes'; // 'themes' | 'diagnostics'
let activeServiceUrl = FB_MESSAGES_URL;

// Diagnostics In-Memory State
let diagnosticsPollTimer = null;

// Ambient Glow State
let ambientGlowEnabled = true;
let frameTintEnabled = false;

// DOM Elements
const brandServiceTitle = document.getElementById('brand-service-title');
const frame = document.getElementById('messenger-frame');
const frameWrapper = document.getElementById('frame-wrapper');
const loader = document.getElementById('loader');
const sleepScreen = document.getElementById('sleep-screen');
const zoomIndicator = document.getElementById('zoom-indicator');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnDesktopMode = document.getElementById('btn-desktop-mode');
const btnReload = document.getElementById('btn-reload');
const btnSuspend = document.getElementById('btn-suspend');
const btnPopout = document.getElementById('btn-popout');
const btnWake = document.getElementById('btn-wake');

// Extension Drawer Elements
const btnAiTheme = document.getElementById('btn-ai-theme');
const btnDiagnostics = document.getElementById('btn-diagnostics');
const aiThemeDrawer = document.getElementById('ai-theme-drawer');
const btnCloseTheme = document.getElementById('btn-close-theme');
const tabBtnThemes = document.getElementById('tab-btn-themes');
const tabBtnDiagnostics = document.getElementById('tab-btn-diagnostics');
const tabContentThemes = document.getElementById('tab-content-themes');
const tabContentDiagnostics = document.getElementById('tab-content-diagnostics');

// Theming & Guide Controls
const chkAmbientGlow = document.getElementById('chk-ambient-glow');
const chkFrameTint = document.getElementById('chk-frame-tint');
const btnHardRefreshDirect = document.getElementById('btn-hard-refresh-direct');

// Diagnostics & Recovery Controls
const btnServiceFacebook = document.getElementById('btn-service-facebook');
const btnServiceMessenger = document.getElementById('btn-service-messenger');
const btnWipeCacheHard = document.getElementById('btn-wipe-cache-hard');
const diagnosticsLogViewer = document.getElementById('diagnostics-log-viewer');
const btnCopyLogs = document.getElementById('btn-copy-logs');

/**
 * Apply Dynamic Zoom & Layout Scaling:
 * Supports standard responsive mode and Desktop 3-Column mode (forces Chat Details panel)
 */
function applyZoom(zoom) {
  currentZoom = Math.min(Math.max(zoom, 40), 160);
  const zoomScale = currentZoom / 100;

  if (isDesktopMode) {
    // In Desktop Mode, virtual width is fixed to 960px so Facebook displays
    // the full 3-column layout (Chats list, Active Chat, and Chat Info & Themes panel)
    const containerWidth = frameWrapper.clientWidth || 360;
    const baseScale = containerWidth / 960;
    const finalScale = baseScale * zoomScale;

    frame.style.width = '960px';
    frame.style.height = `${(100 / finalScale)}%`;
    frame.style.transform = `scale(${finalScale})`;
    frame.style.transformOrigin = '0 0';
  } else {
    frame.style.width = `${(100 / zoomScale)}%`;
    frame.style.height = `${(100 / zoomScale)}%`;
    frame.style.transform = `scale(${zoomScale})`;
    frame.style.transformOrigin = '0 0';
  }

  zoomIndicator.textContent = `${currentZoom}%`;
  browser.storage.local.set({ zoomLevel: currentZoom }).catch(() => {});
}

/**
 * Toggle Desktop 3-Column View Mode:
 * Forces Facebook Messenger to display the Chat Details & Theme Customization panel
 */
function toggleDesktopMode(force) {
  isDesktopMode = force !== undefined ? force : !isDesktopMode;
  if (isDesktopMode) {
    btnDesktopMode.classList.add('active');
    btnDesktopMode.setAttribute('title', 'Desktop View Active: Shows Chat Details & Themes (Ctrl+Alt+D)');
  } else {
    btnDesktopMode.classList.remove('active');
    btnDesktopMode.setAttribute('title', 'Toggle Desktop View: Shows Chat Details & Themes panel side-by-side (Ctrl+Alt+D)');
  }

  applyZoom(currentZoom);
  browser.storage.local.set({ desktopMode: isDesktopMode }).catch(() => {});
}

/**
 * Switch Active Messaging Service Endpoint
 */
function switchService(newUrl) {
  if (activeServiceUrl === newUrl) return;
  activeServiceUrl = newUrl;

  if (newUrl.includes('messenger.com')) {
    brandServiceTitle.textContent = 'Messenger';
    btnServiceMessenger.classList.add('active');
    btnServiceFacebook.classList.remove('active');
  } else {
    brandServiceTitle.textContent = 'FB Messages';
    btnServiceFacebook.classList.add('active');
    btnServiceMessenger.classList.remove('active');
  }

  browser.storage.local.set({ serviceUrl: newUrl }).catch(() => {});
  hardRefresh();
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

  let targetUrl = activeServiceUrl;
  if (forceCacheBust) {
    const sep = targetUrl.includes('?') ? '&' : '?';
    targetUrl += `${sep}_nc_ts=${Date.now()}`;
  }

  if (forceCacheBust || !frame.src || frame.src === 'about:blank' || frame.src === window.location.href) {
    frame.src = targetUrl;
  }
}

/**
 * Hard Refresh & Out-of-Date Loop Recovery:
 * Completely purges browser cache via browsingData API, clears iframe memory,
 * and loads with fresh timestamp cache-buster.
 */
async function hardRefresh() {
  loader.classList.remove('hidden');
  frame.src = 'about:blank';

  try {
    await browser.runtime.sendMessage({ action: 'clearCache' });
  } catch (e) {
    console.warn('Cache clear request failed', e);
  }

  setTimeout(() => {
    loadMessenger(true);
  }, 100);
}

/**
 * Suspend Iframe (Memory Saver: drops RAM/CPU)
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
  frame.src = activeServiceUrl;
}

/**
 * Switch Drawer Tabs: 'themes' | 'diagnostics'
 */
function switchDrawerTab(tab) {
  currentTab = tab;
  if (tab === 'themes') {
    tabBtnThemes.classList.add('active');
    tabBtnDiagnostics.classList.remove('active');
    tabContentThemes.classList.remove('hidden');
    tabContentDiagnostics.classList.add('hidden');
    clearInterval(diagnosticsPollTimer);
  } else {
    tabBtnDiagnostics.classList.add('active');
    tabBtnThemes.classList.remove('active');
    tabContentDiagnostics.classList.remove('hidden');
    tabContentThemes.classList.add('hidden');
    fetchAndRenderDiagnostics();
    clearInterval(diagnosticsPollTimer);
    diagnosticsPollTimer = setInterval(fetchAndRenderDiagnostics, 2500);
  }
}

/**
 * Toggle Drawer Overlay
 */
function toggleDrawer(open, tab = 'themes') {
  isDrawerOpen = open !== undefined ? open : !isDrawerOpen;
  if (isDrawerOpen) {
    aiThemeDrawer.classList.remove('hidden');
    switchDrawerTab(tab);
    if (tab === 'themes') {
      btnAiTheme.classList.add('active');
      btnDiagnostics.classList.remove('active');
    } else {
      btnDiagnostics.classList.add('active');
      btnAiTheme.classList.remove('active');
    }
  } else {
    aiThemeDrawer.classList.add('hidden');
    btnAiTheme.classList.remove('active');
    btnDiagnostics.classList.remove('active');
    clearInterval(diagnosticsPollTimer);
  }
}

/**
 * Fetch and Render Live Diagnostic Logs
 */
async function fetchAndRenderDiagnostics() {
  if (!diagnosticsLogViewer) return;

  try {
    const diag = await browser.runtime.sendMessage({ action: 'getDiagnostics' });
    if (!diag || !diag.logs) {
      diagnosticsLogViewer.textContent = 'No diagnostics available';
      return;
    }

    diagnosticsLogViewer.innerHTML = '';
    const logs = diag.logs;

    if (logs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'log-entry';
      empty.textContent = 'No events recorded yet. Perform actions to see logs.';
      diagnosticsLogViewer.appendChild(empty);
      return;
    }

    logs.forEach(entry => {
      const div = document.createElement('div');
      div.className = `log-entry level-${entry.level}`;
      div.textContent = `[${entry.time}] [${entry.tag}] ${entry.msg}`;
      diagnosticsLogViewer.appendChild(div);
    });

    diagnosticsLogViewer.scrollTop = diagnosticsLogViewer.scrollHeight;
  } catch (err) {
    diagnosticsLogViewer.textContent = `Diagnostics error: ${err.message}`;
  }
}

/**
 * Copy Full Diagnostics to Clipboard
 */
async function copyDiagnosticsToClipboard() {
  try {
    const diag = await browser.runtime.sendMessage({ action: 'getDiagnostics' });
    const text = [
      `### Messenger Sidebar Diagnostic Report`,
      `Timestamp: ${new Date().toISOString()}`,
      `Active Service: ${activeServiceUrl}`,
      `Desktop 3-Column Mode: ${isDesktopMode}`,
      `Zoom: ${currentZoom}%`,
      `Tracked Frame IDs: ${JSON.stringify(diag.sidebarFrameIds || [])}`,
      `Tracked Frame Keys: ${JSON.stringify(diag.sidebarFrameKeys || [])}`,
      ``,
      `### Event Logs (${diag.logs ? diag.logs.length : 0} entries):`,
      ...(diag.logs || []).map(l => `[${l.time}] [${l.level}] [${l.tag}] ${l.msg}`)
    ].join('\n');

    await navigator.clipboard.writeText(text);
    btnCopyLogs.textContent = '✓ Copied!';
    setTimeout(() => {
      btnCopyLogs.textContent = '📋 Copy Logs';
    }, 2000);
  } catch (err) {
    btnCopyLogs.textContent = 'Failed to copy';
    setTimeout(() => {
      btnCopyLogs.textContent = '📋 Copy Logs';
    }, 2000);
  }
}

/**
 * Update Ambient Frame Glow & Tint
 */
function updateAmbientEffects() {
  if (ambientGlowEnabled) {
    frameWrapper.classList.add('has-glow');
  } else {
    frameWrapper.classList.remove('has-glow');
  }

  if (frameTintEnabled) {
    frameWrapper.classList.add('has-tint');
  } else {
    frameWrapper.classList.remove('has-tint');
  }

  browser.storage.local.set({
    aiThemeConfig: {
      ambientGlowEnabled,
      frameTintEnabled
    }
  }).catch(() => {});
}

/**
 * Initialize Event Listeners
 */
function initEvents() {
  // Zoom Controls
  btnZoomIn.addEventListener('click', () => applyZoom(currentZoom + 10));
  btnZoomOut.addEventListener('click', () => applyZoom(currentZoom - 10));
  zoomIndicator.addEventListener('click', () => applyZoom(100));

  // Desktop 3-Column Mode Toggle
  btnDesktopMode.addEventListener('click', () => toggleDesktopMode());

  // Reload: Click = Standard Reload | Shift+Click = Hard Refresh with Cache Wipe
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
          frame.src = activeServiceUrl;
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

  // Wake Button
  btnWake.addEventListener('click', wakeUp);

  // Popout Button
  btnPopout.addEventListener('click', () => {
    browser.runtime.sendMessage({
      action: 'openPopout',
      url: activeServiceUrl
    }).catch(() => {});
  });

  // Drawer Toggles
  btnAiTheme.addEventListener('click', () => toggleDrawer(undefined, 'themes'));
  btnDiagnostics.addEventListener('click', () => toggleDrawer(undefined, 'diagnostics'));
  btnCloseTheme.addEventListener('click', () => toggleDrawer(false));

  tabBtnThemes.addEventListener('click', () => switchDrawerTab('themes'));
  tabBtnDiagnostics.addEventListener('click', () => switchDrawerTab('diagnostics'));

  // Service Mode Selector
  btnServiceFacebook.addEventListener('click', () => switchService(FB_MESSAGES_URL));
  btnServiceMessenger.addEventListener('click', () => switchService(MESSENGER_URL));

  // Cache Wipe Buttons
  btnWipeCacheHard.addEventListener('click', () => {
    hardRefresh();
    toggleDrawer(false);
  });

  btnHardRefreshDirect.addEventListener('click', () => {
    hardRefresh();
    toggleDrawer(false);
  });

  // Copy Logs
  btnCopyLogs.addEventListener('click', copyDiagnosticsToClipboard);

  // Ambient Toggles
  chkAmbientGlow.addEventListener('change', (e) => {
    ambientGlowEnabled = e.target.checked;
    updateAmbientEffects();
  });

  chkFrameTint.addEventListener('change', (e) => {
    frameTintEnabled = e.target.checked;
    updateAmbientEffects();
  });

  // Iframe Load Completed
  frame.addEventListener('load', () => {
    if (frame.src && frame.src !== 'about:blank') {
      loader.classList.add('hidden');
    }
  });

  // Window Resize Observer for Desktop Mode
  window.addEventListener('resize', () => {
    if (isDesktopMode) {
      applyZoom(currentZoom);
    }
  });

  // Keyboard Shortcuts
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
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleDesktopMode();
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

  // Background Commands Listener
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'command_toggle_suspend') {
      if (isSuspended) {
        wakeUp();
      } else {
        suspend();
      }
    } else if (message.action === 'command_toggle_ai_theme') {
      toggleDrawer(undefined, 'themes');
    } else if (message.action === 'command_toggle_desktop_mode') {
      toggleDesktopMode();
    }
  });
}

/**
 * Initialize Sidebar
 */
async function init() {
  try {
    const stored = await browser.storage.local.get(['zoomLevel', 'aiThemeConfig', 'serviceUrl', 'desktopMode']);
    if (stored.zoomLevel) currentZoom = stored.zoomLevel;
    if (stored.desktopMode !== undefined) isDesktopMode = stored.desktopMode;
    if (stored.serviceUrl) {
      activeServiceUrl = stored.serviceUrl;
    } else {
      activeServiceUrl = FB_MESSAGES_URL;
    }

    if (activeServiceUrl.includes('messenger.com')) {
      brandServiceTitle.textContent = 'Messenger';
      btnServiceMessenger.classList.add('active');
      btnServiceFacebook.classList.remove('active');
    } else {
      brandServiceTitle.textContent = 'FB Messages';
      btnServiceFacebook.classList.add('active');
      btnServiceMessenger.classList.remove('active');
    }

    if (isDesktopMode) {
      btnDesktopMode.classList.add('active');
    }

    if (stored.aiThemeConfig) {
      if (stored.aiThemeConfig.ambientGlowEnabled !== undefined) ambientGlowEnabled = stored.aiThemeConfig.ambientGlowEnabled;
      if (stored.aiThemeConfig.frameTintEnabled !== undefined) frameTintEnabled = stored.aiThemeConfig.frameTintEnabled;
      chkAmbientGlow.checked = ambientGlowEnabled;
      chkFrameTint.checked = frameTintEnabled;
    }
  } catch (e) {
    console.warn('Could not read storage preferences', e);
  }

  initEvents();
  updateAmbientEffects();
  applyZoom(currentZoom);
  loadMessenger();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
