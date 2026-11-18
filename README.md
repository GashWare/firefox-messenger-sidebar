# Messenger Sidebar for Firefox 💬⚡

An ultra-lightweight, robust, resource-efficient, and dynamic Firefox WebExtension that docks Facebook Messenger directly into your browser's native sidebar — now featuring an **AI Theming Studio**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox Addon](https://img.shields.io/badge/Firefox-WebExtension-orange.svg)](https://addons.mozilla.org)
[![Version: 1.1.0](https://img.shields.io/badge/Version-1.1.0-brightgreen.svg)]()
[![Security: Clean](https://img.shields.io/badge/Security-0%20Vulnerabilities-brightgreen.svg)]()

---

## ✨ Features

- 📌 **Native Sidebar Docking**: Access your Messenger conversations seamlessly without switching tabs or losing your workflow.
- 🪄 **AI Theming Studio**: Generate custom color themes by prompt (e.g., *"Cyberpunk 2077"*, *"Midnight OLED"*, *"Matcha Forest"*) or choose from 10 curated AI presets with ambient frame glow aura.
- ⚡ **Zero Loop & Auto-Recovery**: Smart cache-busting and bulletproof WebSocket handling fixes "page is out of date" loops and keeps your real-time chat connection rock solid.
- 🪶 **Ultra-Lightweight & Fast**: Pure vanilla JavaScript and CSS with zero heavy dependencies or framework overhead.
- 💤 **Memory Saver Engine**: Manual sleep mode pauses network activity and unloads DOM when requested (`Ctrl + Alt + S`).
- 🔍 **Hardware-Accelerated Dynamic Zoom**: Smooth scaling from 50% to 160% with instant shortcut support (`Ctrl +` / `Ctrl -` / `Ctrl 0`).
- ↗️ **Pop-out Window Mode**: One-click detachment to open Messenger in a dedicated, compact floating window.
- 🔒 **Privacy & Isolation**: Scoped proxy headers that never touch or interfere with your normal browser tabs.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Alt + M` (Mac: `Cmd + Alt + M`) | Toggle Messenger Sidebar open / closed |
| `Ctrl + Alt + T` (Mac: `Cmd + Alt + T`) | Toggle AI Theming Studio |
| `Ctrl + Alt + S` (Mac: `Cmd + Alt + S`) | Toggle Sleep / Memory Saver Mode |
| `Shift + Click ⟳` / `Ctrl + Shift + R` | Hard Refresh (Bypass cache & fix out-of-date states) |
| `Ctrl + +` / `Ctrl + -` | Zoom In / Out |
| `Ctrl + 0` | Reset Zoom to 100% |
| `F5` / `Ctrl + R` | Normal Reload Messenger |

---

## 🚀 Installation

### Option A: Install from Firefox Add-ons (AMO)
Visit the official add-on listing on [addons.mozilla.org](https://addons.mozilla.org/firefox/addon/facebook-messenger-sidebar/) and click **"Add to Firefox"**.

### Option B: Load for Local Development
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select the `manifest.json` file in this repository.

---

## 🛠️ Development & Building

### Available Scripts

- **Run in Firefox**:
  ```bash
  npm start
  ```
- **Lint the extension**:
  ```bash
  npm run lint
  ```
- **Build production package (.zip / .xpi)**:
  ```bash
  npm run build
  ```
  The packaged distribution will be created in `web-ext-artifacts/`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
