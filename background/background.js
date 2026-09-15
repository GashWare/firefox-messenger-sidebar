/**
 * Facebook Messenger Sidebar Addon - Background Service
 * Ultra-lightweight, robust, resource-conscious header proxy and authentication sync.
 */

// Track active configuration
let extensionConfig = {
  defaultMode: 'desktop_compact',
  zoomLevel: 100,
  autoSleepMinutes: 15,
  soundMuted: false
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
  }
});

const filterUrls = [
  "*://*.messenger.com/*",
  "*://*.facebook.com/*",
  "*://*.fbcdn.net/*",
  "*://*.facebook.net/*"
];

/**
 * Outgoing Request Header Filter:
 * Ensures Facebook/Messenger treats sidebar iframe requests as first-party
 * navigation so existing browser authentication cookies are sent and accepted.
 */
browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const requestHeaders = details.requestHeaders || [];
    let hasOrigin = false;
    let hasReferer = false;

    // Determine target origin
    const url = details.url;
    let targetOrigin = "https://www.messenger.com";
    let targetReferer = "https://www.messenger.com/";

    if (url.includes("m.facebook.com")) {
      targetOrigin = "https://m.facebook.com";
      targetReferer = "https://m.facebook.com/";
    } else if (url.includes("facebook.com")) {
      targetOrigin = "https://www.facebook.com";
      targetReferer = "https://www.facebook.com/";
    }

    for (let i = 0; i < requestHeaders.length; i++) {
      const name = requestHeaders[i].name.toLowerCase();

      // Fix Fetch metadata so Facebook doesn't reject as an untrusted third-party frame
      if (name === 'sec-fetch-site') {
        requestHeaders[i].value = 'same-origin';
      } else if (name === 'sec-fetch-dest' && requestHeaders[i].value === 'iframe') {
        requestHeaders[i].value = 'document';
      } else if (name === 'sec-fetch-mode' && requestHeaders[i].value === 'navigate') {
        requestHeaders[i].value = 'navigate';
      } else if (name === 'origin') {
        hasOrigin = true;
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

    if (!hasReferer && (details.type === 'main_frame' || details.type === 'sub_frame')) {
      requestHeaders.push({ name: 'Referer', value: targetReferer });
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
 */
browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    const responseHeaders = details.responseHeaders || [];
    const modifiedHeaders = [];

    for (const header of responseHeaders) {
      const name = header.name.toLowerCase();

      // Remove X-Frame-Options
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

      // Adapt Set-Cookie to ensure SameSite allows iframe session persistence
      if (name === 'set-cookie') {
        let cookieVal = header.value;
        if (cookieVal) {
          // Replace SameSite=Lax or SameSite=Strict with SameSite=None; Secure
          if (/SameSite=(Lax|Strict)/i.test(cookieVal)) {
            cookieVal = cookieVal.replace(/SameSite=(Lax|Strict)/gi, 'SameSite=None');
            if (!/Secure/i.test(cookieVal)) {
              cookieVal += '; Secure';
            }
          }
        }
        modifiedHeaders.push({ name: header.name, value: cookieVal });
        continue;
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
