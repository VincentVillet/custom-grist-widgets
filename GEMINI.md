# GEMINI.md - Project Context & Directives

## 1. Project Overview
**Goal:** Develop multiple custom widgets for **Grist** (spreadsheet-database hybrid) within a single monorepo.
**Developer Background:** Senior Python/Django developer (PyCharm user). New to a dedicated JS dev environment. Prefers clear, structured tooling similar to Django's "batteries included" philosophy.

## 2. Technical Stack
* **Editor:** VS Code.
* **Runtime:** Node.js (LTS).
* **Build Tool:** Vite (configured as Multi-Page App / MPA).
* **Language:** TypeScript (Vanilla/Native, no heavy frameworks yet).
* **Core Dependency:** `@gristlabs/grist-plugin-api`.

## 3. Architecture Decisions
We are using a **Multi-Page App (MPA)** structure to host multiple widgets without managing multiple `package.json` files.

**Directory Structure:**
```text
my-grist-widgets/
├── vite.config.ts       <-- Configured with multiple entry points
├── src/
│   ├── shared/          <-- Common code (CSS, API wrappers)
│   ├── widget-one/      <-- Widget 1
│   │   ├── index.html   <-- Entry point
│   │   └── main.ts      <-- Logic
│   └── widget-two/      <-- Widget 2
Testing Strategy:

Local Logic: Mock window.grist data when !window.grist is detected.

Live Grist Integration:

Tunneling via ngrok http 5173 (Preferred for HTTPS support).


## 4. Current Configuration Reference
vite.config.ts Strategy: Using rollupOptions.input to map multiple HTML entry points.

TypeScript

// Current config logic
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      widgetOne: resolve(__dirname, 'src/widget-one/index.html'),
      // Add new widgets here
    }
  }
}

## 5. Coding Standards & Instructions for AI
TypeScript: Always use strict typing. Treat TS interfaces like Python Pydantic models or Django definitions.

Imports: Use relative paths or configured aliases (e.g., @shared).

Grist API: Ensure grist.ready() is always called. Handle the asynchronous nature of grist.onRecord or grist.onRecords.

Tone: Be concise. Relate JS/TS concepts to Python/Django concepts where helpful (e.g., "This package.json is like your requirements.txt").