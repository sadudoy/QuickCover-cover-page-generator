# Quick Cover — Development Guide

## 1. Prerequisites
- **Node.js**: v18.0.0 or later (v25.x tested).
- **npm**: v9.0.0 or later (v11.x tested).
- Modern web browser supporting ES Modules and standard CSS `@page` printing (Chrome, Edge, Firefox, Safari).

---

## 2. No Build Step
> **Important**: Cover Page Generator has **NO BUILD STEP**.
> There is no Webpack, Vite, Rollup, Babel, PostCSS, or Tailwind compiler.
> Files written in `client/` are standard HTML, CSS, and ES modules that run directly and immediately in the browser runtime.

---

## 3. Running the Local Development Server
To launch the dependency-free static dev server:

```bash
npm run dev
```

- By default, the server listens at **`http://localhost:5173`**.
- It serves the `./client` directory as the web root.
- The port can be customized via the `PORT` environment variable:
  ```bash
  PORT=3000 npm run dev
  ```
- The dev server includes MIME type detection (specifically `text/javascript` required for browser ES modules) and path-traversal prevention.

---

## 4. Running the Test Suite
Cover Page Generator uses Node's built-in native test runner (`node:test`) and strict assertions (`node:assert/strict`):

```bash
npm test
```

- Runs all smoke assertions in `tests/` without requiring third-party testing dependencies.

### Additional Verification Scripts
- **HTTP Endpoints & Path Traversal Verification**:
  ```bash
  node scripts/test-phase3-http.js
  ```
- **Phase 4 Multi-Teacher Interaction Suite (Headless Chromium CDP)**:
  ```bash
  node scripts/test-phase4-interactions.js
  ```
- **Phase 4.5 HTTP Endpoints & Viewport Screenshots Verification**:
  ```bash
  node scripts/verify-phase4-5.js
  ```

---

## 5. Reference PDFs & Inspection Tools
The project repository includes two official reference templates used to maintain design parity:
- **Lab Report Reference**:
  ```text
  reference/lab-report-demo.pdf
  ```
- **Assignment Reference**:
  ```text
  reference/assignment-demo.pdf
  ```
- **Rasterized Preview Assets**:
  - `reference/rendered/lab-report-page-1.png`
  - `reference/rendered/assignment-page-1.png`
- **Inspection Script**: The Python analysis tool `scripts/inspect-pdf.py` can be re-run at any time to re-extract measurements and re-generate rendered PNGs:
  ```bash
  python scripts/inspect-pdf.py
  ```
