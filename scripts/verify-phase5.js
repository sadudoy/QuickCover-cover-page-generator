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
    this.eventListeners = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        const listeners = this.eventListeners.get(msg.method) || [];
        listeners.forEach(fn => fn(msg.params));
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  on(event, fn) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(fn);
  }
}

async function connectToWs(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);
  return new CDPClient(ws);
}

try {
  console.log('=== PART 1: HTTP ENDPOINTS VERIFICATION (SECTION I.3) ===');

  const httpChecks = [
    {
      path: '/create.html',
      expectedStatus: 200,
      expectedType: 'text/html',
      mustContain: ['id="clear-form"', 'id="storage-status"']
    },
    { path: '/js/storage.js', expectedStatus: 200, expectedType: 'javascript' },
    { path: '/js/create.js', expectedStatus: 200, expectedType: 'javascript' },
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
    if (check.mustContain) {
      for (const str of check.mustContain) {
        if (!res.body.includes(str)) {
          throw new Error(`Body of ${check.path} does not contain '${str}'`);
        }
      }
    }
  }

  console.log('\nAll HTTP checks passed successfully!\n');

  console.log('=== PART 2: SCREENSHOT GENERATION & VISUAL AUDIT (SECTION I.4) ===');

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-p5-verify-'));
  const chrome = spawn(BROWSER_PATH, [
    '--headless=new',
    '--remote-debugging-port=9230',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const tabsRes = await fetch('http://127.0.0.1:9230/json');
    const tabs = await tabsRes.json();
    const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
    const cdp = await connectToWs(pageTab.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    cdp.on('Page.javascriptDialogOpening', async () => {
      await cdp.send('Page.handleJavaScriptDialog', { accept: true });
    });

    // 1. Initial Tool Page /create.html at 1280px with "Start over" button visible
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/create.html' });
    await new Promise(r => setTimeout(r, 800));

    const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(RENDERED_DIR, 'create-p5-1280.png'), Buffer.from(shot1.data, 'base64'));
    console.log(`Saved screenshot: create-p5-1280.png (${fs.statSync(path.join(RENDERED_DIR, 'create-p5-1280.png')).size} bytes)`);

    // 2. Populate form fields for reset-before.png
    await cdp.eval(`
      (() => {
        document.getElementById('university').value = 'Bangladesh Army University of Science and Technology';
        document.getElementById('university').dispatchEvent(new Event('input', { bubbles: true }));

        document.getElementById('department').value = 'Department of Computer Science and Engineering';
        document.getElementById('department').dispatchEvent(new Event('input', { bubbles: true }));

        document.getElementById('doc-number').value = '01';
        document.getElementById('doc-number').dispatchEvent(new Event('input', { bubbles: true }));

        document.getElementById('doc-title').value = 'Implementation of Responsive Static Cover Template';
        document.getElementById('doc-title').dispatchEvent(new Event('input', { bubbles: true }));

        document.getElementById('student-name').value = 'Md. Sadman Sakib';
        document.getElementById('student-name').dispatchEvent(new Event('input', { bubbles: true }));

        document.getElementById('student-id').value = '210101001';
        document.getElementById('student-id').dispatchEvent(new Event('input', { bubbles: true }));

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
      })()
    `);
    await new Promise(r => setTimeout(r, 700));

    const shotBefore = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(RENDERED_DIR, 'reset-before.png'), Buffer.from(shotBefore.data, 'base64'));
    console.log(`Saved screenshot: reset-before.png (${fs.statSync(path.join(RENDERED_DIR, 'reset-before.png')).size} bytes)`);

    // 3. Trigger "Start over" and capture reset-after.png
    await cdp.eval(`document.getElementById('clear-form').click()`);
    await new Promise(r => setTimeout(r, 600));

    const shotAfter = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(RENDERED_DIR, 'reset-after.png'), Buffer.from(shotAfter.data, 'base64'));
    console.log(`Saved screenshot: reset-after.png (${fs.statSync(path.join(RENDERED_DIR, 'reset-after.png')).size} bytes)`);

    // 4. Capture cross-tab sync update in Tab B
    await cdp.eval(`
      (() => {
        const newDraft = {
          draftVersion: 2,
          docType: 'lab-report',
          university: 'Cross-Tab Sync University',
          department: 'Dept of Computer Science',
          studentName: 'Alice Smith (Tab A)',
          studentId: '210101099',
          teachers: [{ role: 'Course Teacher', name: 'Dr. Sync Professor', designation: 'Professor' }]
        };
        localStorage.setItem('covercraft-draft-v1', JSON.stringify(newDraft));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'covercraft-draft-v1',
          newValue: JSON.stringify(newDraft)
        }));
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const shotSync = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(RENDERED_DIR, 'crosstab-sync.png'), Buffer.from(shotSync.data, 'base64'));
    console.log(`Saved screenshot: crosstab-sync.png (${fs.statSync(path.join(RENDERED_DIR, 'crosstab-sync.png')).size} bytes)`);

    cdp.ws.close();
  } finally {
    chrome.kill();
    await new Promise(r => setTimeout(r, 500));
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  console.log('\nAll Phase 5 verifications and screenshots completed successfully!\n');

} finally {
  server.kill();
}
