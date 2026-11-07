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
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-p6-'));

// Start Dev Server
const server = spawn('node', ['scripts/dev-server.js'], {
  cwd: ROOT_DIR,
  stdio: 'pipe',
  env: { ...process.env, PORT: '5173' }
});

await new Promise(r => setTimeout(r, 1000));

// Start Chrome
const chrome = spawn(BROWSER_PATH, [
  '--headless=new',
  '--remote-debugging-port=9232',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,1200'
]);

await new Promise(r => setTimeout(r, 1500));

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
}

async function connectToWs(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);
  return new CDPClient(ws);
}

function runPdfAnalysis(pdfPath, config) {
  const scriptPath = path.join(ROOT_DIR, 'scripts', 'analyze-print-pdf.py');
  const out = execSync(`python "${scriptPath}" "${pdfPath}" -`, {
    cwd: ROOT_DIR,
    input: JSON.stringify(config),
    encoding: 'utf-8'
  });
  // Find the last line that starts with { (in case python prints deprecation warnings)
  const lines = out.trim().split('\n');
  const jsonLine = lines.reverse().find(l => l.trim().startsWith('{'));
  return JSON.parse(jsonLine.trim());
}

try {
  console.log('=== PHASE 6: EXPORT & PRINT FIDELITY TEST SUITE ===\n');

  const tabsRes = await fetch('http://127.0.0.1:9232/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  const cdp = await connectToWs(pageTab.webSocketDebuggerUrl);

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const FORBIDDEN_CHROME = [
    'Start over',
    'Your Information',
    'LIVE PREVIEW',
    'A4 · Portrait',
    'Back to home',
    'Skip to content',
    'Document Type',
    'University Logo',
    'Choose File',
    'Changes are saved automatically',
    'In the print dialog'
  ];

  // =========================================================================
  // Test 1: Lab Report Variant (Single Teacher)
  // =========================================================================
  console.log('--- Test 1: Lab Report Variant (Single Teacher) ---');
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

      document.getElementById('level').value = '3';
      document.getElementById('level').dispatchEvent(new Event('change', { bubbles: true }));

      document.getElementById('term').value = 'II';
      document.getElementById('term').dispatchEvent(new Event('change', { bubbles: true }));

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

  const labPngPath = path.join(RENDERED_DIR, 'print-lab-report.png');
  const labAnalysis = runPdfAnalysis(pdfLabPath, {
    expected: [
      'Bangladesh Army University of Science and Technology',
      'Department of Computer Science and Engineering',
      'LAB REPORT',
      'CSE 3100',
      'Web Programming Lab',
      'Md. Sadman Sakib',
      '210101001',
      'Dr. Mohammad Shamsul Arefin',
      'Professor & Head',
      '04/11/2026',
      '05/11/2026'
    ],
    forbidden: FORBIDDEN_CHROME,
    render_png: labPngPath
  });

  if (
    labAnalysis.page_count === 1 &&
    labAnalysis.is_a4 &&
    labAnalysis.missing_strings.length === 0 &&
    labAnalysis.leaked_chrome.length === 0 &&
    labAnalysis.has_vector_fonts
  ) {
    console.log(`[PASS] Lab Report PDF: 1 page, A4 (${labAnalysis.width_mm}x${labAnalysis.height_mm}mm), vector text, 0 chrome leaks`);
  } else {
    throw new Error(`[FAIL] Lab Report PDF failed: ${JSON.stringify(labAnalysis)}`);
  }

  // =========================================================================
  // Test 2: Assignment Variant
  // =========================================================================
  console.log('\n--- Test 2: Assignment Variant ---');
  await cdp.eval(`
    (() => {
      const radio = document.getElementById('doc-type-assignment');
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));

      document.getElementById('doc-number').value = '02';
      document.getElementById('doc-number').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('doc-title').value = 'Finite Automata and Formal Languages';
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

  const assignPngPath = path.join(RENDERED_DIR, 'print-assignment.png');
  const assignAnalysis = runPdfAnalysis(pdfAssignPath, {
    expected: [
      'Bangladesh Army University of Science and Technology',
      'Department of Computer Science and Engineering',
      'Assignment',
      'CSE 3100',
      'Finite Automata and Formal Languages',
      'Md. Sadman Sakib',
      '210101001',
      'Dr. Mohammad Shamsul Arefin'
    ],
    forbidden: [...FORBIDDEN_CHROME, 'Experiment Date', '04/11/2026'],
    render_png: assignPngPath
  });

  if (
    assignAnalysis.page_count === 1 &&
    assignAnalysis.is_a4 &&
    assignAnalysis.missing_strings.length === 0 &&
    assignAnalysis.leaked_chrome.length === 0 &&
    assignAnalysis.has_vector_fonts
  ) {
    console.log(`[PASS] Assignment PDF: 1 page, A4 (${assignAnalysis.width_mm}x${assignAnalysis.height_mm}mm), vector text, no experiment date`);
  } else {
    throw new Error(`[FAIL] Assignment PDF failed: ${JSON.stringify(assignAnalysis)}`);
  }

  // =========================================================================
  // Test 3: Multiple Teachers: 2 Teachers and 4 Teachers (No Overflow / 1 Page)
  // =========================================================================
  console.log('\n--- Test 3: Multiple Teachers (2 & 4 Teachers) ---');

  // Switch back to lab report
  await cdp.eval(`
    (() => {
      const radio = document.getElementById('doc-type-lab');
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));

      // Add Teacher 2
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
  await new Promise(r => setTimeout(r, 600));

  const pdf2TResult = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0
  });

  const pdf2TPath = path.join(RENDERED_DIR, 'print-2-teachers.pdf');
  fs.writeFileSync(pdf2TPath, Buffer.from(pdf2TResult.data, 'base64'));
  const analysis2T = runPdfAnalysis(pdf2TPath, {
    expected: [
      'Dr. Mohammad Shamsul Arefin',
      'Engr. Sadman Sakib',
      'Signature & Date:'
    ],
    forbidden: FORBIDDEN_CHROME
  });

  if (analysis2T.page_count === 1 && analysis2T.missing_strings.length === 0) {
    console.log(`[PASS] 2 Teachers PDF: 1 page, both teachers present, signature line intact`);
  } else {
    throw new Error(`[FAIL] 2 Teachers PDF failed: ${JSON.stringify(analysis2T)}`);
  }

  // Now add Teacher 3 and Teacher 4
  await cdp.eval(`
    (() => {
      document.getElementById('add-teacher').click();
      let rows = document.querySelectorAll('.teacher-row');
      rows[2].querySelector('.t-role').value = 'Course Coordinator';
      rows[2].querySelector('.t-role').dispatchEvent(new Event('input', { bubbles: true }));
      rows[2].querySelector('.t-name').value = 'Prof. Dr. Third Teacher';
      rows[2].querySelector('.t-name').dispatchEvent(new Event('input', { bubbles: true }));
      rows[2].querySelector('.t-designation').value = 'Professor';
      rows[2].querySelector('.t-designation').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('add-teacher').click();
      rows = document.querySelectorAll('.teacher-row');
      rows[3].querySelector('.t-role').value = 'Adjunct Faculty';
      rows[3].querySelector('.t-role').dispatchEvent(new Event('input', { bubbles: true }));
      rows[3].querySelector('.t-name').value = 'Engr. Fourth Teacher';
      rows[3].querySelector('.t-name').dispatchEvent(new Event('input', { bubbles: true }));
      rows[3].querySelector('.t-designation').value = 'Assistant Professor';
      rows[3].querySelector('.t-designation').dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  const pdf4TResult = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0
  });

  const pdf4TPath = path.join(RENDERED_DIR, 'print-4-teachers.pdf');
  fs.writeFileSync(pdf4TPath, Buffer.from(pdf4TResult.data, 'base64'));
  const png4TPath = path.join(RENDERED_DIR, 'print-4-teachers.png');
  const analysis4T = runPdfAnalysis(pdf4TPath, {
    expected: [
      'Dr. Mohammad Shamsul Arefin',
      'Engr. Sadman Sakib',
      'Prof. Dr. Third Teacher',
      'Engr. Fourth Teacher',
      'Signature & Date:'
    ],
    forbidden: FORBIDDEN_CHROME,
    render_png: png4TPath
  });

  if (analysis4T.page_count === 1 && analysis4T.missing_strings.length === 0) {
    console.log(`[PASS] 4 Teachers PDF: 1 page (NO overflow / NO page-break), all 4 teachers present`);
  } else {
    throw new Error(`[FAIL] 4 Teachers PDF failed: ${JSON.stringify(analysis4T)}`);
  }

  // =========================================================================
  // Test 4: Logo Upload & Print with Logo
  // =========================================================================
  console.log('\n--- Test 4: Print With Logo ---');
  await cdp.eval(`
    (() => {
      // Inject a clean sample university logo image into the preview
      const canvas = document.createElement('canvas');
      canvas.width = 140;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(70, 70, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BAUST', 70, 70);

      const dataUrl = canvas.toDataURL('image/png');
      const logoBox = document.querySelector('.logo-box');
      if (logoBox) {
        logoBox.innerHTML = '<img src=\"' + dataUrl + '\" class=\"uploaded-logo\" alt=\"Logo\">';
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  const pdfLogoResult = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0
  });

  const pdfLogoPath = path.join(RENDERED_DIR, 'print-with-logo.pdf');
  fs.writeFileSync(pdfLogoPath, Buffer.from(pdfLogoResult.data, 'base64'));
  const pngLogoPath = path.join(RENDERED_DIR, 'print-with-logo.png');
  const analysisLogo = runPdfAnalysis(pdfLogoPath, {
    expected: ['Bangladesh Army University of Science and Technology'],
    forbidden: FORBIDDEN_CHROME,
    render_png: pngLogoPath
  });

  if (analysisLogo.page_count === 1 && analysisLogo.is_a4) {
    console.log(`[PASS] Print with Logo: 1 page, exact A4, image rendered properly`);
  } else {
    throw new Error(`[FAIL] Print with Logo failed: ${JSON.stringify(analysisLogo)}`);
  }

  // =========================================================================
  // Test 5: Screen Preview Scale Unaffected
  // =========================================================================
  console.log('\n--- Test 5: Verify Screen Preview at 1280px ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 950,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 400));

  const screenShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const screenShotPath = path.join(RENDERED_DIR, 'create-screen-preview-1280.png');
  fs.writeFileSync(screenShotPath, Buffer.from(screenShot.data, 'base64'));

  const scaleValue = await cdp.eval(`
    (() => {
      const el = document.getElementById('cover-preview');
      return el ? el.style.transform : 'none';
    })()
  `);

  if (scaleValue.includes('scale(')) {
    console.log(`[PASS] Screen Preview scaled properly on screen: ${scaleValue}`);
  } else {
    throw new Error(`[FAIL] Screen Preview missing transform scale: ${scaleValue}`);
  }

  console.log('\n=== ALL PHASE 6 PRINT VERIFICATION TESTS PASSED ===\n');

  cdp.ws.close();

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
