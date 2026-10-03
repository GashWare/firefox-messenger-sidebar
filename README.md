# Messenger Sidebar for Firefox 💬⚡

An ultra-lightweight, robust, resource-efficient, and dynamic Firefox WebExtension that docks Facebook Messenger directly into your browser's native sidebar.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox Addon](https://img.shields.io/badge/Firefox-WebExtension-orange.svg)](https://addons.mozilla.org)
[![Security: Clean](https://img.shields.io/badge/Security-0%20Vulnerabilities-brightgreen.svg)]()

---

## ✨ Features

- 📌 **Native Sidebar Docking**: Access your Messenger conversations seamlessly without switching tabs or losing your workflow.
- 🪶 **Ultra-Lightweight & Fast**: Built with pure vanilla JavaScript and CSS. Zero heavy dependencies, zero bundle bloat.
- 💤 **Memory Saver Engine**: Integrated sleep/suspension mode unloads the iframe DOM and stops network activity when idle, reducing memory and CPU footprint to near zero.
- 🔍 **Hardware-Accelerated Dynamic Zoom**: Smooth scaling from 50% to 160% with instant shortcut support (`Ctrl +` / `Ctrl -` / `Ctrl 0`).
- ↗️ **Pop-out Window Mode**: One-click detachment to open Messenger in a dedicated, compact floating window.
- 🌓 **Adaptive Theme**: Automatically matches your Firefox and OS Dark/Light theme.
- 🔒 **Privacy & Security First**: Zero data collection, zero telemetry, and scoped permissions.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Alt + M` (Mac: `Cmd + Alt + M`) | Toggle Messenger Sidebar open / closed |
| `Ctrl + Alt + S` (Mac: `Cmd + Alt + S`) | Toggle Sleep / Memory Saver Mode |
| `Ctrl + +` / `Ctrl + -` | Zoom In / Out |
| `Ctrl + 0` | Reset Zoom to 100% |
| `F5` / `Ctrl + R` | Reload Messenger |

---

## 🚀 Installation

### Option A: Install from Firefox Add-ons (AMO)
*(Once published on addons.mozilla.org)*
1. Visit the add-on listing page on [addons.mozilla.org](https://addons.mozilla.org).
2. Click **"Add to Firefox"**.

### Option B: Load for Local Development
1. Open Firefox and navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Click **"Load Temporary Add-on..."**.
3. Select the `manifest.json` file in this repository.

---

## 🛠️ Development & Building

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Mozilla Firefox](https://www.mozilla.org/firefox/)

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

## 📂 Project Structure

```text
├── background/
│   └── background.js       # Header proxy & command handler
├── icons/                  # High-resolution extension icons
├── options/
│   ├── options.html        # Settings interface
│   ├── options.css
│   └── options.js
├── sidebar/
│   ├── sidebar.html        # Main sidebar interface
│   ├── sidebar.css
│   └── sidebar.js          # Scaling, memory saver & lifecycle engine
├── scripts/
│   └── PowerShell/         # Build & asset utilities
├── manifest.json           # WebExtension Manifest V2
└── package.json            # Scripts & metadata
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
