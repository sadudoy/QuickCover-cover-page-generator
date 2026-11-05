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
console.log(`Using browser: ${BROWSER_PATH}`);

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
  console.log('=== PART 1: HTTP ENDPOINTS VERIFICATION (SECTION L.2) ===');

  // Test 1: GET / -> 200 text/html (contains "Cover Page Generator" and href="create.html")
  const resRoot = await fetchHttp('/');
  console.log(`GET / -> ${resRoot.statusCode} (content-type: ${resRoot.contentType})`);
  const rootHasTitle = resRoot.body.includes('Cover Page Generator');
  const rootHasLink = resRoot.body.includes('href="create.html"');
  console.log(`  - Contains "Cover Page Generator": ${rootHasTitle}`);
  console.log(`  - Contains href="create.html": ${rootHasLink}`);
  if (resRoot.statusCode !== 200 || !rootHasTitle || !rootHasLink) {
    throw new Error('GET / assertion failed');
  }

  // Test 2: GET /create.html -> 200 text/html
  const resCreate = await fetchHttp('/create.html');
  console.log(`GET /create.html -> ${resCreate.statusCode} (content-type: ${resCreate.contentType})`);
  if (resCreate.statusCode !== 200 || !resCreate.contentType.includes('text/html')) {
    throw new Error('GET /create.html assertion failed');
  }

  // Test 3: GET /css/site.css -> 200 text/css
  const resSiteCss = await fetchHttp('/css/site.css');
  console.log(`GET /css/site.css -> ${resSiteCss.statusCode} (content-type: ${resSiteCss.contentType})`);
  if (resSiteCss.statusCode !== 200 || !resSiteCss.contentType.includes('text/css')) {
    throw new Error('GET /css/site.css assertion failed');
  }

  // Test 4: GET /css/landing.css -> 200 text/css
  const resLandingCss = await fetchHttp('/css/landing.css');
  console.log(`GET /css/landing.css -> ${resLandingCss.statusCode} (content-type: ${resLandingCss.contentType})`);
  if (resLandingCss.statusCode !== 200 || !resLandingCss.contentType.includes('text/css')) {
    throw new Error('GET /css/landing.css assertion failed');
  }

  // Test 5: GET /js/site.js -> 200 text/javascript
  const resSiteJs = await fetchHttp('/js/site.js');
  console.log(`GET /js/site.js -> ${resSiteJs.statusCode} (content-type: ${resSiteJs.contentType})`);
  if (resSiteJs.statusCode !== 200 || !resSiteJs.contentType.includes('text/javascript')) {
    throw new Error('GET /js/site.js assertion failed');
  }

  // Test 6: GET /../reference/lab-report-demo.pdf -> 404
  const resTraversal = await fetchHttp('/../reference/lab-report-demo.pdf');
  console.log(`GET /../reference/lab-report-demo.pdf -> ${resTraversal.statusCode}`);
  if (resTraversal.statusCode !== 404) {
    throw new Error(`Path traversal expected 404, got ${resTraversal.statusCode}`);
  }

  console.log('\nAll HTTP checks passed successfully!\n');

  console.log('=== PART 2: SCREENSHOT GENERATION & AUDIT (SECTION L.3) ===');

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-v45-'));
  const chrome = spawn(BROWSER_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const tabsRes = await fetch('http://127.0.0.1:9224/json');
    const tabs = await tabsRes.json();
    const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    const cdp = new CDPClient(ws);

    await cdp.send('Page.enable');

    const screenshots = [
      { name: 'landing-360.png', url: 'http://127.0.0.1:5173/', width: 360, height: 800 },
      { name: 'landing-768.png', url: 'http://127.0.0.1:5173/', width: 768, height: 1024 },
      { name: 'landing-1280.png', url: 'http://127.0.0.1:5173/', width: 1280, height: 900 },
      { name: 'create-768.png', url: 'http://127.0.0.1:5173/create.html', width: 768, height: 1024 },
      { name: 'create-1280.png', url: 'http://127.0.0.1:5173/create.html', width: 1280, height: 900 }
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

    ws.close();
  } finally {
    chrome.kill();
    await new Promise(r => setTimeout(r, 500));
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup locks on temp dir in Windows
    }
  }

  console.log('\nAll Section L.2 and L.3 checks complete!\n');

} finally {
  server.kill();
}
