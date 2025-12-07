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
```
**Testing Strategy:**

Local Logic: Mock window.grist data when !window.grist is detected.

**Live Grist Integration:**

Tunneling via ngrok http 5173 (Preferred for HTTPS support).


## 4. Current Configuration Reference
vite.config.ts Strategy: Using rollupOptions.input to map multiple HTML entry points.

```TypeScript
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
```

## 5. Coding Standards & Instructions for AI
TypeScript: Always use strict typing. Treat TS interfaces like Python Pydantic models or Django definitions.

Imports: Use relative paths or configured aliases (e.g., @shared).

Grist API: Ensure grist.ready() is always called. Handle the asynchronous nature of grist.onRecord or grist.onRecords.

Tone: Be concise. Relate JS/TS concepts to Python/Django concepts where helpful (e.g., "This package.json is like your requirements.txt").

## 6. Lessons Learned & Best Practices

Our initial development surfaced several key insights into the Grist Widget API:

1.  **Use Bulk Actions:** For performance and to avoid API rate limits, always use bulk actions (`BulkAddRecord`, `BulkRemoveRecord`) or `ReplaceTableData` instead of single actions in a loop. Multiple actions can be bundled into a single `applyUserActions` call to perform a single, atomic transaction.

2.  **Column-Oriented Data for Bulk Actions:** Bulk actions for writing data (e.g., `BulkAddRecord`) require data in a **column-oriented** format (`BulkColValues`), not a row-oriented one. This means transforming data from `[ {colA: val1}, {colA: val2} ]` to `{ colA: [val1, val2] }`.

3.  **`applyUserActions` is Key:** The primary method for writing data to any table is `grist.docApi.applyUserActions()`. Simpler helpers on the `grist` object are typically for the widget's source table only.

4.  **Date Handling:** Grist stores date/datetime values as numeric timestamps (seconds since the UTC epoch). `grist.onRecords()` provides date/datetime values as JavaScript `Date` objects directly, not as timestamps. However, `grist.docApi.fetchTable()` returns them as numeric timestamps (seconds since epoch). This distinction is critical for comparisons and processing, and careful UTC handling is recommended.

5.  **API Reference:** The Grist Widget API is sparsely documented. We have created `Grist_actions.md` as a practical, user-friendly reference for the `applyUserActions` format.

6. **Managing options** See `Grist_options.md` for Grist option documentation.

7.  **Data Format Variation:** Be aware that different Grist API functions return data in different formats. `grist.docApi.fetchTable()` returns data in a **columnar format** (`{ colA: [...], colB: [...] }`), while `grist.onRecords()` provides data in a **row-oriented format** (`[{ colA: ..., colB: ... }, ...]`). Helper functions in `src/shared/grist-data-helpers.ts` are available to convert between these formats.
