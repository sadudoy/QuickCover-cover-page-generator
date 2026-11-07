import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RENDERED_DIR = path.join(ROOT_DIR, 'reference', 'rendered');

fs.mkdirSync(RENDERED_DIR, { recursive: true });

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
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-vpf-'));

// Dev Server
const server = spawn('node', ['scripts/dev-server.js'], {
  cwd: ROOT_DIR,
  stdio: 'pipe',
  env: { ...process.env, PORT: '5173' }
});

await new Promise(r => setTimeout(r, 1000));

// Headless Chrome
const chrome = spawn(BROWSER_PATH, [
  '--headless=new',
  '--remote-debugging-port=9233',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check'
]);

await new Promise(r => setTimeout(r, 1500));

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
}

function runPdfAnalysis(pdfPath, config) {
  const scriptPath = path.join(ROOT_DIR, 'scripts', 'analyze-print-pdf.py');
  const out = execSync(`python "${scriptPath}" "${pdfPath}" -`, {
    cwd: ROOT_DIR,
    input: JSON.stringify(config),
    encoding: 'utf-8'
  });
  const lines = out.trim().split('\n');
  const jsonLine = lines.reverse().find(l => l.trim().startsWith('{'));
  return JSON.parse(jsonLine.trim());
}

try {
  console.log('=== VERIFY PRINT FIDELITY PIPELINE (SECTION D.3) ===\n');

  const tabsRes = await fetch('http://127.0.0.1:9233/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  const cdp = new CDPClient(ws);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const FORBIDDEN_CHROME = [
    'Start over',
    'Your Information',
    'LIVE PREVIEW',
    'A4 · Portrait',
    'Back to home',
    'Skip to content',
    'Document Type'
  ];

  // 1. Lab Report Variant
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/create.html' });
  await new Promise(r => setTimeout(r, 1000));

  await cdp.eval(`
    (() => {
      document.getElementById('university').value = 'Bangladesh Army University of Science and Technology';
      document.getElementById('university').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('department').value = 'Department of Computer Science and Engineering';
      document.getElementById('department').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('course-code').value = 'CSE 3100';
      document.getElementById('course-code').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('course-title').value = 'Web Programming Lab';
      document.getElementById('course-title').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('doc-number').value = '01';
      document.getElementById('doc-number').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('doc-title').value = 'Implementation of Responsive Static Cover Template';
      document.getElementById('doc-title').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('student-name').value = 'Md. Sadman Sakib';
      document.getElementById('student-name').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('student-id').value = '210101001';
      document.getElementById('student-id').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('experiment-date').value = '2026-11-04';
      document.getElementById('experiment-date').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('submission-date').value = '2026-11-05';
      document.getElementById('submission-date').dispatchEvent(new Event('input', { bubbles: true }));

      const row1 = document.querySelector('.teacher-row');
      row1.querySelector('.t-role').value = 'Course Teacher';
      row1.querySelector('.t-role').dispatchEvent(new Event('input', { bubbles: true }));
      row1.querySelector('.t-name').value = 'Dr. Mohammad Shamsul Arefin';
      row1.querySelector('.t-name').dispatchEvent(new Event('input', { bubbles: true }));
      row1.querySelector('.t-designation').value = 'Professor & Head';
      row1.querySelector('.t-designation').dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  const pdfLabResult = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0
  });

  const pdfLabPath = path.join(RENDERED_DIR, 'print-lab-report.pdf');
  fs.writeFileSync(pdfLabPath, Buffer.from(pdfLabResult.data, 'base64'));

  const analysisLab = runPdfAnalysis(pdfLabPath, {
    expected: [
      'Bangladesh Army University of Science and Technology',
      'LAB REPORT',
      'CSE 3100',
      'Md. Sadman Sakib',
      'Dr. Mohammad Shamsul Arefin'
    ],
    forbidden: FORBIDDEN_CHROME,
    render_png: path.join(RENDERED_DIR, 'print-lab-report.png')
  });

  console.log('Assertion Lab Report:');
  console.log(`  - Page Count === 1: ${analysisLab.page_count === 1} (${analysisLab.page_count})`);
  console.log(`  - Dimensions A4 (595x842 pt): ${analysisLab.is_a4} (${analysisLab.width_pt}x${analysisLab.height_pt} pt)`);
  console.log(`  - Expected Text Found: ${analysisLab.missing_strings.length === 0}`);
  console.log(`  - Zero Chrome Leaked: ${analysisLab.leaked_chrome.length === 0}`);
  console.log(`  - Vector Fonts (Times New Roman): ${analysisLab.has_vector_fonts} (${analysisLab.fonts.join(', ')})`);

  if (analysisLab.page_count !== 1 || !analysisLab.is_a4 || analysisLab.missing_strings.length > 0) {
    throw new Error('Lab report print fidelity assertion failed');
  }

  // 2. Assignment Variant
  await cdp.eval(`
    (() => {
      const radio = document.getElementById('doc-type-assignment');
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));

      document.getElementById('doc-number').value = '02';
      document.getElementById('doc-number').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('doc-title').value = 'Finite Automata Theory';
      document.getElementById('doc-title').dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  const pdfAssignResult = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0
  });

  const pdfAssignPath = path.join(RENDERED_DIR, 'print-assignment.pdf');
  fs.writeFileSync(pdfAssignPath, Buffer.from(pdfAssignResult.data, 'base64'));

  const analysisAssign = runPdfAnalysis(pdfAssignPath, {
    expected: [
      'Bangladesh Army University of Science and Technology',
      'Assignment',
      'Finite Automata Theory',
      'Md. Sadman Sakib'
    ],
    forbidden: [...FORBIDDEN_CHROME, 'Experiment Date'],
    render_png: path.join(RENDERED_DIR, 'print-assignment.png')
  });

  console.log('\nAssertion Assignment:');
  console.log(`  - Page Count === 1: ${analysisAssign.page_count === 1} (${analysisAssign.page_count})`);
  console.log(`  - Dimensions A4 (595x842 pt): ${analysisAssign.is_a4} (${analysisAssign.width_pt}x${analysisAssign.height_pt} pt)`);
  console.log(`  - Expected Text Found: ${analysisAssign.missing_strings.length === 0}`);
  console.log(`  - Zero Chrome Leaked: ${analysisAssign.leaked_chrome.length === 0}`);
  console.log(`  - Vector Fonts (Times New Roman): ${analysisAssign.has_vector_fonts} (${analysisAssign.fonts.join(', ')})`);

  if (analysisAssign.page_count !== 1 || !analysisAssign.is_a4 || analysisAssign.missing_strings.length > 0) {
    throw new Error('Assignment print fidelity assertion failed');
  }

  console.log('\n=== ALL PRINT FIDELITY ASSERTIONS PASSED ===\n');

  ws.close();
} finally {
  chrome.kill();
  server.kill();
  await new Promise(r => setTimeout(r, 500));
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
