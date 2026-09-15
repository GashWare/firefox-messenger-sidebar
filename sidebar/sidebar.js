/**
 * Ultra-lightweight Facebook Messenger Sidebar Controller
 * Features: Dedicated Messenger instance, GPU-accelerated dynamic zoom, Memory Saver Engine.
 */

const MESSENGER_URL = 'https://www.messenger.com/';

// State
let currentZoom = 100;
let isSuspended = false;
let idleTimer = null;
let autoSleepMinutes = 15;

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
 * Load Messenger into iframe
 */
function loadMessenger() {
  if (isSuspended) {
    wakeUp();
  }

  loader.classList.remove('hidden');
  frame.src = MESSENGER_URL;
  resetIdleTimer();
}

/**
 * Suspend Iframe (Memory Saver: drops RAM and CPU to near 0)
 */
function suspend() {
  isSuspended = true;
  frame.src = 'about:blank';
  sleepScreen.classList.remove('hidden');
  loader.classList.add('hidden');
  btnSuspend.classList.add('active');
  btnSuspend.setAttribute('title', 'Resume Messenger');
  clearTimeout(idleTimer);
}

/**
 * Wake Up Iframe from Sleep Mode
 */
function wakeUp() {
  isSuspended = false;
  sleepScreen.classList.add('hidden');
  btnSuspend.classList.remove('active');
  btnSuspend.setAttribute('title', 'Memory Saver: Suspend Messenger');
  loadMessenger();
}

/**
 * Reset and manage Idle Timer for Memory Saver
 */
function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (autoSleepMinutes > 0 && !isSuspended) {
    idleTimer = setTimeout(() => {
      suspend();
    }, autoSleepMinutes * 60 * 1000);
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

  // Reload
  btnReload.addEventListener('click', () => {
    if (isSuspended) {
      wakeUp();
    } else {
      loader.classList.remove('hidden');
      try {
        frame.contentWindow.location.reload();
      } catch (e) {
        frame.src = MESSENGER_URL;
      }
    }
  });

  // Suspend Toggle
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

  // Iframe Load Completed
  frame.addEventListener('load', () => {
    if (frame.src !== 'about:blank') {
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
        btnReload.click();
      }
    }
  });

  // User activity resets idle timer
  ['mousemove', 'keydown', 'click', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetIdleTimer, { passive: true });
  });

  // Listen for messages from background (e.g. shortcut commands)
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'command_toggle_suspend') {
      if (isSuspended) {
        wakeUp();
      } else {
        suspend();
      }
    }
  });
}

/**
 * Initialize Sidebar
 */
async function init() {
  try {
    const stored = await browser.storage.local.get(['zoomLevel', 'autoSleepMinutes']);
    if (stored.zoomLevel) currentZoom = stored.zoomLevel;
    if (stored.autoSleepMinutes !== undefined) autoSleepMinutes = stored.autoSleepMinutes;
  } catch (e) {
    console.warn('Could not read storage preferences', e);
  }

  initEvents();
  applyZoom(currentZoom);
  loadMessenger();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
