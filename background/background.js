/**
 * Facebook Messenger Sidebar Addon - Background Service
 * Ultra-lightweight, robust, resource-conscious header proxy and authentication sync.
 */

// Track active configuration
let extensionConfig = {
  zoomLevel: 100,
  soundMuted: false,
  aiTheme: null
};

// Initialize configuration from storage
browser.storage.local.get(extensionConfig).then((stored) => {
  extensionConfig = { ...extensionConfig, ...stored };
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    for (const key in changes) {
      extensionConfig[key] = changes[key].newValue;
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
  } catch (e) {
    if (browser.sidebarAction.open) {
      await browser.sidebarAction.open();
    }
  }
});

/**
 * Handle Extension Commands (Shortcuts)
 */
browser.commands.onCommand.addListener((command) => {
  if (command === 'toggle-suspend') {
    browser.runtime.sendMessage({ action: 'command_toggle_suspend' }).catch(() => {});
  } else if (command === 'toggle-ai-theme') {
    browser.runtime.sendMessage({ action: 'command_toggle_ai_theme' }).catch(() => {});
  }
});

const filterUrls = [
  "*://*.messenger.com/*",
  "*://*.facebook.com/*",
  "*://*.fbcdn.net/*",
  "*://*.facebook.net/*"
];

/**
 * Robust check: identifies requests originating from our extension's sidebar or popup.
 * CRITICAL: Must return false for regular browser tabs so we NEVER interfere with
 * the user's regular Facebook tabs, sessions, cookies, or WebSockets.
 */
function isSidebarRequest(details) {
  const extPrefix = `moz-extension://${browser.runtime.id}`;

  if (details.documentUrl && details.documentUrl.startsWith(extPrefix)) return true;
  if (details.originUrl && details.originUrl.startsWith(extPrefix)) return true;

  if (details.frameAncestors && Array.isArray(details.frameAncestors)) {
    for (const ancestor of details.frameAncestors) {
      if (ancestor.url && ancestor.url.startsWith(extPrefix)) return true;
    }
  }

  // Requests originating from the extension sidebar panel have tabId === -1 in Firefox
  if (details.tabId === -1) return true;

  return false;
}

/**
 * Outgoing Request Header Filter:
 * Ensures the initial sidebar iframe document navigation loads cleanly.
 * CRITICAL FIX: Only touches sub_frame / main_frame navigations.
 * Subresources (scripts, WebSockets, XHR/GraphQL) are left alone with their
 * native headers so WebSockets (wss://gateway.facebook.com) handshake successfully
 * without getting rejected and triggering the "page is out of date" error loop.
 */
browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Only intercept requests belonging to our sidebar/extension!
    if (!isSidebarRequest(details)) {
      return;
    }

    const requestHeaders = details.requestHeaders || [];
    const url = details.url;

    // For the iframe document navigation itself:
    if (details.type === 'sub_frame' || details.type === 'main_frame') {
      let targetOrigin = "https://www.messenger.com";
      let targetReferer = "https://www.messenger.com/";

      if (url.includes("m.facebook.com")) {
        targetOrigin = "https://m.facebook.com";
        targetReferer = "https://m.facebook.com/";
      } else if (url.includes("facebook.com")) {
        targetOrigin = "https://www.facebook.com";
        targetReferer = "https://www.facebook.com/";
      }

      let hasReferer = false;

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
        }
      }

      if (!hasReferer) {
        requestHeaders.push({ name: 'Referer', value: targetReferer });
      }

      return { requestHeaders: requestHeaders };
    }

    // For subresources (websocket, xmlhttprequest, script, stylesheet, image, etc.):
    // Leave sec-fetch-site and sec-fetch-dest 100% UNTOUCHED!
    // Only cleanse moz-extension:// if explicitly leaked in Referer:
    let modified = false;
    for (let i = 0; i < requestHeaders.length; i++) {
      const name = requestHeaders[i].name.toLowerCase();
      if ((name === 'referer' || name === 'origin') && requestHeaders[i].value.startsWith('moz-extension://')) {
        requestHeaders[i].value = "https://www.messenger.com/";
        modified = true;
      }
    }

    if (modified) {
      return { requestHeaders: requestHeaders };
    }
  },
  {
    urls: filterUrls,
    types: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'xmlhttprequest', 'websocket', 'other']
  },
  ['blocking', 'requestHeaders']
);

/**
 * Incoming Response Header Modifier:
 * Strips frame restrictions ONLY for sidebar requests.
 * CRITICAL FIX: Does NOT alter Set-Cookie headers. Mutating cookies to SameSite=None
 * breaks Facebook session validation and causes crashes / unexpected logouts.
 */
browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    // Only intercept requests belonging to our sidebar!
    if (!isSidebarRequest(details)) {
      return;
    }

    const responseHeaders = details.responseHeaders || [];
    const modifiedHeaders = [];

    for (const header of responseHeaders) {
      const name = header.name.toLowerCase();

      // Remove X-Frame-Options to allow embedding in sidebar
      if (name === 'x-frame-options') {
        continue;
      }

      // Remove Cross-Origin isolation blockers that break iframes
      if (name === 'cross-origin-opener-policy' || name === 'cross-origin-embedder-policy') {
        continue;
      }

      // Sanitize Content-Security-Policy to remove frame-ancestors
      if (name === 'content-security-policy') {
        let value = header.value;
        if (value) {
          value = value.replace(/frame-ancestors\s+[^;]+;?/gi, '');
          modifiedHeaders.push({ name: header.name, value: value });
          continue;
        }
      }

      modifiedHeaders.push(header);
    }

    return { responseHeaders: modifiedHeaders };
  },
  {
    urls: filterUrls,
    types: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'xmlhttprequest', 'websocket', 'other']
  },
  ['blocking', 'responseHeaders']
);

// Message Handler
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getConfig') {
    sendResponse({ config: extensionConfig });
    return true;
  }
  if (message.action === 'openPopout') {
    const url = message.url || 'https://www.messenger.com/';
    browser.windows.create({
      url: url,
      type: 'popup',
      width: 480,
      height: 750
    });
    return true;
  }
});
