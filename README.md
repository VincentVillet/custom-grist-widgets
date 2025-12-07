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

## 6. Live Grist Integration

To test your widget with a real Grist document, you need to make your local development server accessible to the Grist web application. The recommended way to do this is with [ngrok](https://ngrok.com/), which creates a secure public URL for your local server.

### Prerequisites

*   **ngrok account and CLI:** [Download and install the ngrok CLI](https://ngrok.com/download). You will also need to sign up for a free account to get an authtoken.

### Steps to Connect to Grist

1.  **Start the Vite Dev Server:**
    Run your local server as usual. Note the port it's running on (typically 5173).
    ```bash
    npm run dev
    ```

2.  **Start ngrok:**
    In a **new terminal window**, start ngrok to create a tunnel to your Vite server's port.
    ```bash
    # Replace 5173 if your server is on a different port
    ngrok http 5173
    ```

3.  **Get the Public URL:**
    Ngrok will display a public "Forwarding" URL (e.g., `https://<random-string>.ngrok-free.app`). You need the **HTTPS** version of this URL.

4.  **Add the Widget to Grist:**
    a. Open any Grist document (either on the hosted service or your own instance).
    b. Click **"Add New"** > **"Add Widget"** > select **"Custom"**.
    c. In the widget configuration panel on the right, under **"URL"**, paste the full HTTPS URL to your widget's `index.html` file. For example:
    `https://<random-string>.ngrok-free.app/src/widget-one/index.html`
    d. Click **"Apply"**. Your local widget should now load in the Grist document.

    Thanks to Vite's Hot Module Replacement (HMR), any changes you save in your code will automatically reflect in the widget loaded in Grist.

## 7. Production, Deployment, and Privacy

When you are ready to use your widget in production, you should not use `ngrok`. Instead, you will build the static files and host them on a web server.

### Building for Production

Run the following command to build your project:

```bash
npm run build
```

This will create a `dist/` directory containing optimized, static HTML, CSS, and JavaScript files for each widget entry point defined in `vite.config.ts`.

### Deployment

You can host the contents of the `dist/` directory on any static web hosting service (e.g., Vercel, Netlify, AWS S3, or your own server).

The URL you use in Grist will be the public URL to your hosted widget's `index.html` file (e.g., `https://your-server.com/widget-one/index.html`).

### Keeping Widgets Private

There are two primary methods to use a widget in Grist without exposing its source code on the public internet.

#### Method 1: Private Network Hosting (Most Secure)

Host the static files from the `dist/` directory on a **private, internal web server** that is only accessible within your organization's network or VPN.

1.  **Host the `dist/` folder** on an internal server.
2.  The Grist instance you are using must be able to access this internal URL. This is most feasible if you are self-hosting Grist within the same network.
3.  Use the internal URL (e.g., `https://your-internal-domain/widgets/widget-one/index.html`) in the Custom Widget configuration.

This approach ensures that only authorized users and services on your network can access the widget's code.

#### Method 2: Token-Based Authentication (Capability URL)

If you cannot use a private network, you can protect your widget by requiring a secret token in the URL. Anyone with the full, secret URL can access the widget, but it won't be discoverable by others.

**The Concept:** Your hosting server acts as a guard. It inspects incoming requests for a specific query parameter (e.g., `?token=...`) and only serves the files if the token is correct.

**How to Implement:**

This logic must be implemented on the **server-side**, not within the widget's frontend code. Simple static hosting services like GitHub Pages cannot do this. You need a hosting provider that can run code.

1.  **Generate a Secret Token:** Create a strong, unpredictable random string. You can use a password generator for this.
2.  **Configure Your Hosting Environment:**
    *   **Using a Cloud Function (e.g., AWS Lambda, Netlify/Vercel Functions):** This is a great approach. Create a simple function that:
        a.  Receives the HTTP request.
        b.  Checks if the query parameter `token` matches your secret (which should be stored as an environment variable, not hard-coded).
        c.  If the token is valid, serve the widget's `index.html` file.
        d.  If not, return a `403 Forbidden` error.
    *   **Using Edge Middleware (Vercel, Cloudflare Workers):** Configure a middleware rule that runs before a request hits your static files. This rule performs the same token validation logic as a cloud function.
    *   **Using a Web Server (Nginx, Apache):** You can write configuration rules to inspect query parameters and conditionally serve files or return an error.

3.  **Use the Secret URL in Grist:**
    Once configured, your URL in Grist will look like this:
    `https://your-server.com/widget-one/index.html?token=YOUR_SECRET_TOKEN`

> **Security Note:** Treat this URL, including the token, as a password. While this prevents public discovery, anyone who has the full URL can access the widget. The token may also be visible in server logs or browser history. This method is more secure than a public link but less secure than private network hosting.

## 8. Coding Standards
*   **TypeScript:** Always use strict typing. Treat TS interfaces like Python Pydantic models or Django definitions.
*   **Imports:** Use relative paths or configured aliases (e.g., `@shared`).
*   **Grist API:** Ensure `grist.ready()` is always called. Handle the asynchronous nature of `grist.onRecord` or `grist.onRecords`.
