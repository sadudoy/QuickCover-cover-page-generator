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
  console.log('=== PART 1: HTTP ENDPOINTS VERIFICATION ===');

  const httpChecks = [
    { path: '/', expectedStatus: 200, mustContain: 'Quick Cover', expectedType: 'text/html' },
    { path: '/create.html', expectedStatus: 200, mustContain: 'Quick Cover', expectedType: 'text/html' },
    { path: '/css/landing.css', expectedStatus: 200, expectedType: 'text/css' },
    { path: '/css/form.css', expectedStatus: 200, expectedType: 'text/css' },
    { path: '/../reference/quick_cover_ui_reference.html', expectedStatus: 404 },
    { path: '/../reference/lab-report-demo.pdf', expectedStatus: 404 }
  ];

  for (const check of httpChecks) {
    const res = await fetchHttp(check.path);
    console.log(`GET ${check.path} -> ${res.statusCode} (content-type: ${res.contentType})`);
    if (res.statusCode !== check.expectedStatus) {
      throw new Error(`Expected status ${check.expectedStatus} for ${check.path}, got ${res.statusCode}`);
    }
    if (check.expectedType && !res.contentType.includes(check.expectedType)) {
      throw new Error(`Expected content-type ${check.expectedType} for ${check.path}, got ${res.contentType}`);
    }
    if (check.mustContain && !res.body.includes(check.mustContain)) {
      throw new Error(`Body of ${check.path} does not contain '${check.mustContain}'`);
    }
  }

  console.log('\nAll HTTP checks passed successfully!\n');

  console.log('=== PART 2: SCREENSHOT GENERATION & AUDIT ===');

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-p4-verify-'));
  const chrome = spawn(BROWSER_PATH, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const tabsRes = await fetch('http://127.0.0.1:9226/json');
    const tabs = await tabsRes.json();
    const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    const cdp = new CDPClient(ws);

    await cdp.send('Page.enable');

    // 1. Landing page at 1280 and 768
    for (const item of [
      { name: 'landing-qc-1280.png', width: 1280, height: 900, full: true },
      { name: 'landing-qc-768.png', width: 768, height: 1024, full: true }
    ]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: item.width,
        height: item.height,
        deviceScaleFactor: 1,
        mobile: item.width < 768
      });
      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
      await new Promise(r => setTimeout(r, 800));

      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: item.full
      });
      const targetPath = path.join(RENDERED_DIR, item.name);
      fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${item.name} (${item.width}px, ${fs.statSync(targetPath).size} bytes)`);
    }

    // 2. Tool page create.html (default single-teacher state) at 1280 and 768
    for (const item of [
      { name: 'create-qc-1280.png', width: 1280, height: 900, full: false },
      { name: 'create-qc-768.png', width: 768, height: 1024, full: false }
    ]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: item.width,
        height: item.height,
        deviceScaleFactor: 1,
        mobile: item.width < 768
      });
      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/create.html' });
      await new Promise(r => setTimeout(r, 800));

      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: item.full
      });
      const targetPath = path.join(RENDERED_DIR, item.name);
      fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${item.name} (${item.width}x${item.height}, ${fs.statSync(targetPath).size} bytes)`);
    }

    // 3. Tool page create.html with 2 teachers (multi-teacher preview verification)
    {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 1200,
        deviceScaleFactor: 1,
        mobile: false
      });
      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/create.html' });
      await new Promise(r => setTimeout(r, 800));

      // Fill Teacher 1 name + role + designation, and add Teacher 2
      await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const row1 = document.querySelector('.teacher-row');
            row1.querySelector('.t-role').value = 'Course Teacher';
            row1.querySelector('.t-role').dispatchEvent(new Event('input', { bubbles: true }));
            row1.querySelector('.t-name').value = 'Dr. Mohammad Shamsul Arefin';
            row1.querySelector('.t-name').dispatchEvent(new Event('input', { bubbles: true }));
            row1.querySelector('.t-designation').value = 'Professor & Head';
            row1.querySelector('.t-designation').dispatchEvent(new Event('input', { bubbles: true }));
            
            document.getElementById('add-teacher').click();
            
            const rows = document.querySelectorAll('.teacher-row');
            const row2 = rows[1];
            row2.querySelector('.t-role').value = 'Lab Instructor';
            row2.querySelector('.t-role').dispatchEvent(new Event('input', { bubbles: true }));
            row2.querySelector('.t-name').value = 'Engr. Sadman Sakib';
            row2.querySelector('.t-name').dispatchEvent(new Event('input', { bubbles: true }));
            row2.querySelector('.t-designation').value = 'Lecturer';
            row2.querySelector('.t-designation').dispatchEvent(new Event('input', { bubbles: true }));

            window.scrollTo(0, 320);
          })()
        `
      });
      await new Promise(r => setTimeout(r, 600));

      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const targetPath = path.join(RENDERED_DIR, 'create-multi-teacher-1280.png');
      fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: create-multi-teacher-1280.png (${fs.statSync(targetPath).size} bytes)`);
    }

    // 4. Reference HTML captures for comparison
    const refHtmlPath = 'file:///' + path.join(ROOT_DIR, 'reference', 'quick_cover_ui_reference.html').replace(/\\/g, '/');

    // Reference landing
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: refHtmlPath });
    await new Promise(r => setTimeout(r, 600));
    const refLandingData = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(RENDERED_DIR, 'reference-landing-1280.png'), Buffer.from(refLandingData.data, 'base64'));
    console.log(`Saved screenshot: reference-landing-1280.png (${fs.statSync(path.join(RENDERED_DIR, 'reference-landing-1280.png')).size} bytes)`);

    // Reference editor
    await cdp.send('Runtime.evaluate', { expression: 'showEditor()' });
    await new Promise(r => setTimeout(r, 600));
    const refEditorData = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(RENDERED_DIR, 'reference-editor-1280.png'), Buffer.from(refEditorData.data, 'base64'));
    console.log(`Saved screenshot: reference-editor-1280.png (${fs.statSync(path.join(RENDERED_DIR, 'reference-editor-1280.png')).size} bytes)`);

    ws.close();
  } finally {
    chrome.kill();
    await new Promise(r => setTimeout(r, 500));
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  console.log('\nAll Phase 4 verifications and screenshots completed successfully!\n');

} finally {
  server.kill();
}
