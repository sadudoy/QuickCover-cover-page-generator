import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RENDERED_DIR = path.join(ROOT_DIR, 'reference', 'rendered');

const WINDOWS_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

function findBrowserBinary() {
  for (const candidate of WINDOWS_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'google-chrome';
}

const BROWSER_PATH = findBrowserBinary();

// Start Dev Server
const server = spawn('node', ['scripts/dev-server.js'], {
  cwd: ROOT_DIR,
  stdio: 'pipe',
  env: { ...process.env, PORT: '5173' }
});

await new Promise(r => setTimeout(r, 1000));

async function fetchHttp(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:5173${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'] || '',
          body: data
        });
      });
    });
    req.on('error', reject);
  });
}

class CDPClient {
  constructor(ws) {
    this.ws = ws;
    this.id = 1;
    this.callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

try {
  console.log('=== PART 1: HTTP ENDPOINTS VERIFICATION (SECTION F.2) ===');

  // Test 1: GET / -> 200 text/html (contains "Quick Cover")
  const resRoot = await fetchHttp('/');
  console.log(`GET / -> ${resRoot.statusCode} (content-type: ${resRoot.contentType})`);
  const rootHasTitle = resRoot.body.includes('Quick Cover');
  console.log(`  - Contains "Quick Cover": ${rootHasTitle}`);
  if (resRoot.statusCode !== 200 || !rootHasTitle) {
    throw new Error('GET / assertion failed');
  }

  // Test 2: GET /create.html -> 200 text/html (contains "Quick Cover")
  const resCreate = await fetchHttp('/create.html');
  console.log(`GET /create.html -> ${resCreate.statusCode} (content-type: ${resCreate.contentType})`);
  const createHasTitle = resCreate.body.includes('Quick Cover');
  console.log(`  - Contains "Quick Cover": ${createHasTitle}`);
  if (resCreate.statusCode !== 200 || !createHasTitle) {
    throw new Error('GET /create.html assertion failed');
  }

  // Test 3: GET /../reference/quick_cover_ui_reference.html -> 404
  const resRefTraversal = await fetchHttp('/../reference/quick_cover_ui_reference.html');
  console.log(`GET /../reference/quick_cover_ui_reference.html -> ${resRefTraversal.statusCode}`);
  if (resRefTraversal.statusCode !== 404) {
    throw new Error(`Expected 404 for reference file traversal, got ${resRefTraversal.statusCode}`);
  }

  // Test 4: GET /../reference/lab-report-demo.pdf -> 404
  const resPdfTraversal = await fetchHttp('/../reference/lab-report-demo.pdf');
  console.log(`GET /../reference/lab-report-demo.pdf -> ${resPdfTraversal.statusCode}`);
  if (resPdfTraversal.statusCode !== 404) {
    throw new Error(`Expected 404 for PDF traversal, got ${resPdfTraversal.statusCode}`);
  }

  console.log('\nAll HTTP checks passed successfully!\n');

  console.log('=== PART 2: SCREENSHOT GENERATION & AUDIT (SECTION F.3) ===');

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-v46-'));
  const chrome = spawn(BROWSER_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const tabsRes = await fetch('http://127.0.0.1:9225/json');
    const tabs = await tabsRes.json();
    const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    const cdp = new CDPClient(ws);

    await cdp.send('Page.enable');

    // 1. Tool Page create.html
    const screenshots = [
      { name: 'create-qc-1280.png', url: 'http://127.0.0.1:5173/create.html', width: 1280, height: 900 },
      { name: 'create-qc-768.png', url: 'http://127.0.0.1:5173/create.html', width: 768, height: 1024 },
      { name: 'landing-qc-1280.png', url: 'http://127.0.0.1:5173/', width: 1280, height: 900 }
    ];

    for (const item of screenshots) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: item.width,
        height: item.height,
        deviceScaleFactor: 1,
        mobile: item.width < 768
      });
      await cdp.send('Page.navigate', { url: item.url });
      await new Promise(r => setTimeout(r, 800));

      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const targetPath = path.join(RENDERED_DIR, item.name);
      fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
      const stat = fs.statSync(targetPath);
      console.log(`Saved screenshot: ${item.name} (${item.width}x${item.height}, ${stat.size} bytes)`);
    }

    // 2. Reference HTML in editor mode for direct comparison
    const refHtmlPath = 'file:///' + path.join(ROOT_DIR, 'reference', 'quick_cover_ui_reference.html').replace(/\\/g, '/');

    for (const width of [1280, 768]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height: width === 1280 ? 900 : 1024,
        deviceScaleFactor: 1,
        mobile: width < 768
      });
      await cdp.send('Page.navigate', { url: refHtmlPath });
      await new Promise(r => setTimeout(r, 500));

      // Trigger showEditor() to render the editor view
      await cdp.send('Runtime.evaluate', { expression: 'showEditor()' });
      await new Promise(r => setTimeout(r, 500));

      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const refName = `reference-editor-${width}.png`;
      const targetPath = path.join(RENDERED_DIR, refName);
      fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${refName} (${width}px, ${fs.statSync(targetPath).size} bytes)`);
    }

    ws.close();
  } finally {
    chrome.kill();
    await new Promise(r => setTimeout(r, 500));
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore lock
    }
  }

  console.log('\nAll Section F.2 and F.3 checks complete!\n');

} finally {
  server.kill();
}
