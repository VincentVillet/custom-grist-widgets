# My Grist Widgets

## 1. Project Overview

**Goal:** Develop multiple custom widgets for [Grist](https://www.getgrist.com/) (spreadsheet-database hybrid) within a single monorepo. This setup is designed to provide a clear, structured tooling experience similar to "batteries included" frameworks.

## 2. Technical Stack

*   **Editor:** VS Code
*   **Runtime:** Node.js (LTS)
*   **Build Tool:** Vite (configured as Multi-Page Application / MPA)
*   **Language:** TypeScript (Vanilla/Native, strict typing)
*   **Core Dependency:** `grist-plugin-api`

## 3. Architecture

This project uses a **Multi-Page Application (MPA)** structure to host multiple widgets within a single monorepo, avoiding the need for multiple `package.json` files.

### Directory Structure:

```
my-grist-widgets/
├── vite.config.ts           <-- Vite configuration for MPA
├── src/
│   ├── shared/              <-- Common code (CSS, API wrappers, utilities)
│   │   └── style.css
│   └── widget-one/          <-- Example Widget 1
│       ├── index.html       <-- Entry point for Widget 1
│       └── main.ts          <-- Logic for Widget 1
├── index.html               <-- Main landing page with links to widgets
├── package.json
├── tsconfig.json
└── ...                      <-- Other project files (node_modules, .git, etc.)
```

## 4. Development Setup

### Installation:

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    cd my-grist-widgets
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Development Server:

To start the Vite development server:

```bash
npm run dev
```

This will typically start the server on `http://localhost:5173` (or another available port).

### Viewing Widgets:

*   **Main Landing Page:** Open the root `index.html` in your browser (e.g., `http://localhost:5173/`). This page provides links to all configured widgets.
*   **Direct Access to Widget-One:** You can directly access the example widget at `http://localhost:5173/src/widget-one/index.html`.

## 5. Adding New Widgets

To add a new Grist widget:

1.  **Create a new widget directory:**
    Create a new folder under `src/`, for example, `src/widget-two/`.
    ```bash
    mkdir src/widget-two
    ```
2.  **Add `index.html`:**
    Create an `index.html` file inside your new widget directory (e.g., `src/widget-two/index.html`). This will be the entry point for your widget. You can copy the content from `src/widget-one/index.html` as a starting point.
3.  **Add `main.ts`:**
    Create a `main.ts` file inside your new widget directory (e.g., `src/widget-two/main.ts`). This will contain your widget's logic. Remember to call `grist.ready()` as per Grist API requirements. You can copy content from `src/widget-one/main.ts` as a starting point.
4.  **Update `vite.config.ts`:**
    Add a new entry to the `build.rollupOptions.input` object in `vite.config.ts` for your new widget.
    ```typescript
    // vite.config.ts
    import { resolve } from 'path';
    import { defineConfig } from 'vite';

    export default defineConfig({
      build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            'widget-one': resolve(__dirname, 'src/widget-one/index.html'),
            'widget-two': resolve(__dirname, 'src/widget-two/index.html'), // Add this line
          },
        },
      },
    });
    ```
5.  **Update the main `index.html` (optional but recommended):**
    Add a link to your new widget on the main `index.html` page for easy navigation during development.

## 6. Coding Standards

*   **TypeScript:** Always use strict typing. Treat TS interfaces like Python Pydantic models or Django definitions.
*   **Imports:** Use relative paths or configured aliases (e.g., `@shared`).
*   **Grist API:** Ensure `grist.ready()` is always called. Handle the asynchronous nature of `grist.onRecord` or `grist.onRecords`.
