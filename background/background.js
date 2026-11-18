/**
 * Facebook Messenger Sidebar Addon - Background Service
 * Ultra-lightweight, robust, resource-conscious header proxy,
 * cross-domain session cookie persistence layer, high-verbosity diagnostic logging,
 * and service worker cache management engine.
 */

const EXT_URL = browser.runtime.getURL(""); // e.g. "moz-extension://<UUID>/"

// Diagnostics In-Memory Log Buffer (Keeps last 300 events)
const LOG_BUFFER = [];
const MAX_LOGS = 300;

function log(level, tag, ...args) {
  const time = new Date().toISOString().substring(11, 23);
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  const entry = { time, level, tag, msg };
  
  LOG_BUFFER.push(entry);
  if (LOG_BUFFER.length > MAX_LOGS) {
    LOG_BUFFER.shift();
  }

  const formatted = `[${time}] [${tag}] ${msg}`;
  if (level === 'ERROR') {
    console.error(formatted);
  } else if (level === 'WARN') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

const Logger = {
  info: (tag, ...args) => log('INFO', tag, ...args),
  warn: (tag, ...args) => log('WARN', tag, ...args),
  error: (tag, ...args) => log('ERROR', tag, ...args)
};

Logger.info('BG:Init', `Background service worker active. Extension URL: ${EXT_URL}`);

// Track active configuration (Default to official Facebook Messages endpoint)
let extensionConfig = {
  zoomLevel: 100,
  soundMuted: false,
  serviceUrl: 'https://www.facebook.com/messages/t/',
  desktopMode: false,
  aiThemeConfig: null
};

// Initialize configuration from storage
browser.storage.local.get(extensionConfig).then((stored) => {
  extensionConfig = { ...extensionConfig, ...stored };
  Logger.info('BG:Config', 'Config loaded from storage', extensionConfig);
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    for (const key in changes) {
      extensionConfig[key] = changes[key].newValue;
      Logger.info('BG:ConfigChange', `Key '${key}' updated`, changes[key].newValue);
    }
  }
});

/**
 * Handle Toolbar Icon Click:
 * Toggles the sidebar open/closed seamlessly.
 */
browser.browserAction.onClicked.addListener(async () => {
  try {
    if (browser.sidebarAction.toggle) {
      await browser.sidebarAction.toggle();
    } else {
      const isOpen = await browser.sidebarAction.isOpen({});
      if (isOpen) {
        await browser.sidebarAction.close();
      } else {
        await browser.sidebarAction.open();
      }
    }
    Logger.info('BG:Action', 'Sidebar toggled via browserAction icon');
  } catch (e) {
    if (browser.sidebarAction.open) {
      await browser.sidebarAction.open();
    }
    Logger.warn('BG:Action', 'Sidebar open fallback executed', e.message);
  }
});

/**
 * Handle Extension Commands (Shortcuts)
 */
browser.commands.onCommand.addListener((command) => {
  Logger.info('BG:Command', `Shortcut executed: ${command}`);
  if (command === 'toggle-suspend') {
    browser.runtime.sendMessage({ action: 'command_toggle_suspend' }).catch(() => {});
  } else if (command === 'toggle-ai-theme') {
    browser.runtime.sendMessage({ action: 'command_toggle_ai_theme' }).catch(() => {});
  } else if (command === 'toggle-desktop-mode') {
    browser.runtime.sendMessage({ action: 'command_toggle_desktop_mode' }).catch(() => {});
  }
});

const filterUrls = [
  "*://*.messenger.com/*",
  "*://*.facebook.com/*",
  "*://*.fbcdn.net/*",
  "*://*.facebook.net/*"
];

// Set of frame IDs and frame keys (tabId:frameId) belonging to the sidebar
const sidebarFrameIds = new Set();
const sidebarFrameKeys = new Set();

/**
 * Cached session cookie string to prevent excessive cookie store lookups.
 * Invalidated periodically or on Set-Cookie updates.
 */
let cachedCookieString = null;
let lastCookieFetchTime = 0;
const COOKIE_CACHE_TTL = 3000; // 3 seconds

/**
 * Resolves comprehensive session cookies across .facebook.com and .messenger.com.
 * Fixes the "on-and-off" authentication and version mismatch errors where
 * cross-site iframes lose the critical c_user / xs / datr tokens.
 */
async function getSessionCookieHeader(url) {
  const now = Date.now();
  if (cachedCookieString && (now - lastCookieFetchTime < COOKIE_CACHE_TTL)) {
    return cachedCookieString;
  }

  const cookieMap = new Map();

  try {
    // 1. Direct URL cookies
    const cookieUrl = url.startsWith('ws') ? url.replace(/^ws/, 'http') : url;
    const directCookies = await browser.cookies.getAll({ url: cookieUrl });
    for (const c of directCookies) {
      cookieMap.set(c.name, c.value);
    }

    // 2. Always fetch .facebook.com cookies (contains the core c_user, xs, datr, sb tokens)
    const fbCookies = await browser.cookies.getAll({ domain: '.facebook.com' });
    for (const c of fbCookies) {
      if (!cookieMap.has(c.name)) {
        cookieMap.set(c.name, c.value);
      }
    }

    // 3. Also fetch .messenger.com cookies
    const msgrCookies = await browser.cookies.getAll({ domain: '.messenger.com' });
    for (const c of msgrCookies) {
      if (!cookieMap.has(c.name)) {
        cookieMap.set(c.name, c.value);
      }
    }
  } catch (e) {
    Logger.warn('BG:CookieFetchErr', e.message);
  }

  if (cookieMap.size > 0) {
    cachedCookieString = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    lastCookieFetchTime = now;
  }

  return cachedCookieString;
}

/**
 * Identifies requests originating from our extension's sidebar or popup.
 * Sub_frames loading messenger/facebook inside the browser are always captured.
 */
function isSidebarRequest(details) {
  // Any sub_frame request targeted at messenger/facebook is an embedded frame
  if (details.type === 'sub_frame') {
    return true;
  }

  // Direct extension document/origin check
  if (details.documentUrl && (details.documentUrl.startsWith(EXT_URL) || details.documentUrl.startsWith("moz-extension://"))) {
    return true;
  }
  if (details.originUrl && (details.originUrl.startsWith(EXT_URL) || details.originUrl.startsWith("moz-extension://"))) {
    return true;
  }
  if (details.initiator && (details.initiator.startsWith(EXT_URL) || details.initiator.startsWith("moz-extension://"))) {
    return true;
  }

  // Frame ancestors check (ancestor is sidebar.html)
  if (details.frameAncestors && Array.isArray(details.frameAncestors)) {
    for (const ancestor of details.frameAncestors) {
      if (ancestor && ancestor.url && (ancestor.url.startsWith(EXT_URL) || ancestor.url.startsWith("moz-extension://"))) {
        return true;
      }
    }
  }

  // Tracked frame ID / key check
  if (details.frameId && sidebarFrameIds.has(details.frameId)) {
    return true;
  }
  const frameKey = `${details.tabId}:${details.frameId}`;
  if (sidebarFrameKeys.has(frameKey)) {
    return true;
  }

  // Standalone extension context check (tabId === -1)
  if (details.tabId === -1) {
    return true;
  }

  return false;
}

/**
 * Outgoing Request Header Filter:
 * Ensures the initial sidebar iframe document navigation loads cleanly.
 * Restores session cookies stripped by Firefox Total Cookie Protection in cross-site iframes.
 */
browser.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    // Only intercept requests belonging to our sidebar!
    if (!isSidebarRequest(details)) {
      return;
    }

    const requestHeaders = details.requestHeaders || [];
    const url = details.url;

    // Track frameId if it's the sub_frame navigation inside sidebar.html
    if (details.type === 'sub_frame') {
      sidebarFrameIds.add(details.frameId);
      const frameKey = `${details.tabId}:${details.frameId}`;
      sidebarFrameKeys.add(frameKey);
      Logger.info('BG:SubFrameRegister', `Registered sidebar frameId: ${details.frameId} key: ${frameKey} for: ${url.substring(0, 50)}...`);
    }

    // Determine target origin and referer
    let targetOrigin = "https://www.facebook.com";
    let targetReferer = "https://www.facebook.com/";

    if (url.includes("messenger.com")) {
      targetOrigin = "https://www.messenger.com";
      targetReferer = "https://www.messenger.com/";
    } else if (url.includes("m.facebook.com")) {
      targetOrigin = "https://m.facebook.com";
      targetReferer = "https://m.facebook.com/";
    }

    // For the iframe document navigation itself:
    if (details.type === 'sub_frame' || details.type === 'main_frame') {
      let hasReferer = false;
      let hasCacheControl = false;

      for (let i = 0; i < requestHeaders.length; i++) {
        const name = requestHeaders[i].name.toLowerCase();

        // Ensure browser navigates as a top-level document from Messenger's perspective
        if (name === 'sec-fetch-dest' && requestHeaders[i].value === 'iframe') {
          requestHeaders[i].value = 'document';
        } else if (name === 'sec-fetch-site' && requestHeaders[i].value === 'cross-site') {
          requestHeaders[i].value = 'same-origin';
        } else if (name === 'origin') {
          if (requestHeaders[i].value.startsWith('moz-extension://')) {
            requestHeaders[i].value = targetOrigin;
          }
        } else if (name === 'referer') {
          hasReferer = true;
          if (requestHeaders[i].value.startsWith('moz-extension://')) {
            requestHeaders[i].value = targetReferer;
          }
        } else if (name === 'cache-control') {
          hasCacheControl = true;
          requestHeaders[i].value = 'no-cache';
        }
      }

      if (!hasReferer) {
        requestHeaders.push({ name: 'Referer', value: targetReferer });
      }

      if (!hasCacheControl) {
        requestHeaders.push({ name: 'Cache-Control', value: 'no-cache' });
        requestHeaders.push({ name: 'Pragma', value: 'no-cache' });
      }
    }

    // CRITICAL: Cookie Injection for Firefox Total Cookie Protection (TCP / dFPI)
    // Ensures c_user and xs session cookies are ALWAYS present on sub_frame, XHR, and WebSockets.
    let cookieHeader = requestHeaders.find(h => h.name.toLowerCase() === 'cookie');
    const isMissingAuth = !cookieHeader || !cookieHeader.value || !cookieHeader.value.includes('c_user');

    if (isMissingAuth && browser.cookies) {
      const fullCookies = await getSessionCookieHeader(url);
      if (fullCookies) {
        if (cookieHeader) {
          cookieHeader.value = fullCookies;
        } else {
          requestHeaders.push({ name: 'Cookie', value: fullCookies });
        }
        Logger.info('BG:CookieInject', `Restored session cookies for ${details.type} -> ${url.substring(0, 45)}`);
      }
    }

    return { requestHeaders: requestHeaders };
  },
  {
    urls: filterUrls,
    types: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'xmlhttprequest', 'websocket', 'other']
  },
  ['blocking', 'requestHeaders']
);

/**
 * Incoming Response Header Modifier:
 * Strips frame restrictions and adapts cookies for iframe embedding.
 * Prevents caching stale Messenger HTML documents so out-of-date chunk mismatches never persist.
 */
browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    // Always strip framing restrictions on sub_frame requests!
    if (!isSidebarRequest(details) && details.type !== 'sub_frame') {
      return;
    }

    const responseHeaders = details.responseHeaders || [];
    const modifiedHeaders = [];

    for (const header of responseHeaders) {
      const name = header.name.toLowerCase();

      // 1. Remove X-Frame-Options to allow embedding in sidebar
      if (name === 'x-frame-options') {
        Logger.info('BG:StripHeader', `Stripped X-Frame-Options from ${details.url.substring(0, 45)}`);
        continue;
      }

      // 2. Remove Cross-Origin isolation blockers that break iframes
      if (name === 'cross-origin-opener-policy' || name === 'cross-origin-embedder-policy') {
        Logger.info('BG:StripHeader', `Stripped ${name}`);
        continue;
      }

      // 3. Sanitize Content-Security-Policy to remove frame-ancestors
      if (name === 'content-security-policy' || name === 'content-security-policy-report-only') {
        let value = header.value;
        if (value) {
          value = value.replace(/frame-ancestors\s+[^;]+;?/gi, '');
          modifiedHeaders.push({ name: header.name, value: value });
          Logger.info('BG:SanitizeCSP', `Sanitized frame-ancestors from ${name}`);
          continue;
        }
      }

      // 4. Adapt Set-Cookie to ensure SameSite=None; Secure allows iframe session persistence
      if (name === 'set-cookie') {
        let cookieVal = header.value;
        if (cookieVal) {
          cachedCookieString = null; // Invalidate cache so new token is picked up
          if (/SameSite=(Lax|Strict)/i.test(cookieVal)) {
            cookieVal = cookieVal.replace(/SameSite=(Lax|Strict)/gi, 'SameSite=None');
          } else if (!cookieVal.includes('SameSite=')) {
            cookieVal += '; SameSite=None';
          }
          if (!/Secure/i.test(cookieVal)) {
            cookieVal += '; Secure';
          }
          modifiedHeaders.push({ name: header.name, value: cookieVal });
          Logger.info('BG:CookieAdapt', `Adapted Set-Cookie to SameSite=None; Secure`);
          continue;
        }
      }

      // 5. For the top-level HTML document, ensure it is never stored stale in disk cache
      if (details.type === 'sub_frame' && name === 'cache-control') {
        modifiedHeaders.push({ name: header.name, value: 'no-cache, no-store, must-revalidate' });
        continue;
      }

      modifiedHeaders.push(header);
    }

    if (details.type === 'sub_frame') {
      modifiedHeaders.push({ name: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' });
      modifiedHeaders.push({ name: 'Pragma', value: 'no-cache' });
      modifiedHeaders.push({ name: 'Expires', value: '0' });
    }

    return { responseHeaders: modifiedHeaders };
  },
  {
    urls: filterUrls,
    types: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'xmlhttprequest', 'websocket', 'other']
  },
  ['blocking', 'responseHeaders']
);

/**
 * Log WebRequest Errors for High-Verbosity Diagnostics
 */
browser.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (isSidebarRequest(details)) {
      Logger.error('BG:NetError', `Request failed: ${details.url.substring(0, 70)} | Error: ${details.error} | Type: ${details.type}`);
    }
  },
  { urls: filterUrls }
);

// Message Handler
browser.runtime.onMessage.addListener(async (message, sender) => {
  Logger.info('BG:Message', `Received action: ${message.action}`);

  if (message.action === 'getConfig') {
    return { config: extensionConfig };
  }

  if (message.action === 'getDiagnostics') {
    return {
      logs: LOG_BUFFER,
      extUrl: EXT_URL,
      sidebarFrameIds: Array.from(sidebarFrameIds),
      sidebarFrameKeys: Array.from(sidebarFrameKeys),
      config: extensionConfig,
      timestamp: new Date().toISOString()
    };
  }

  if (message.action === 'clearCache') {
    try {
      cachedCookieString = null;
      if (browser.browsingData && browser.browsingData.remove) {
        // Clear disk cache AND stale Comet service workers
        await browser.browsingData.remove({}, { cache: true, serviceWorkers: true });
        Logger.info('BG:CacheClear', 'Purged disk cache and stale service workers via browsingData API');
      } else if (browser.browsingData && browser.browsingData.removeCache) {
        await browser.browsingData.removeCache({});
      }
      return { success: true };
    } catch (e) {
      Logger.error('BG:CacheClear', 'Failed to clear cache: ' + e.message);
      return { success: false, error: e.message };
    }
  }

  if (message.action === 'openPopout') {
    const url = message.url || extensionConfig.serviceUrl || 'https://www.facebook.com/messages/t/';
    browser.windows.create({
      url: url,
      type: 'popup',
      width: 960,
      height: 750
    });
    Logger.info('BG:Popout', `Opened popout window for ${url}`);
    return true;
  }
});
