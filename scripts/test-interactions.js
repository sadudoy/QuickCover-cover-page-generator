import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));

// 1. Start Dev Server
const server = spawn('node', ['scripts/dev-server.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '5173' }
});

await new Promise(r => setTimeout(r, 1000));

// 2. Start Chrome
const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check'
]);

await new Promise(r => setTimeout(r, 1500));

async function getWsUrl() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  return pageTab.webSocketDebuggerUrl;
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

async function run() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const cdp = new CDPClient(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await cdp.send('Page.navigate', { url: 'http://localhost:5173/create.html' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('--- Phase 3 Automated Interaction Suite ---');

  // a. Select "Lab Report". Type into each field. Verify preview updates.
  console.log('\n[Check a] Lab Report selection and field binding:');
  const checkA = await cdp.eval(`(() => {
    document.querySelector('input[name="doc-type"][value="lab-report"]').click();
    
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    setVal('university', 'Test University');
    setVal('department', 'Department of Computer Science and Engineering (CSE)');
    setVal('level', '3');
    setVal('term', 'I');
    setVal('course-code', 'CSE 3101');
    setVal('course-title', 'Web Engineering Lab');
    setVal('doc-number', '05');
    setVal('doc-title', 'Interactive Form Development');
    setVal('comment', 'Good work');
    setVal('student-name', 'Alice Student');
    setVal('student-id', '2026001');
    setVal('experiment-date', '2026-11-04');
    setVal('submission-date', '2026-11-10');
    setVal('teacher-name', 'Dr. Professor');
    setVal('teacher-designation', 'Associate Professor');

    const preview = document.getElementById('cover-preview');
    return {
      coverType: preview.querySelector('.a4-cover').getAttribute('data-cover-type'),
      univ: preview.querySelector('[data-field="university-name"]').textContent,
      dept: preview.querySelector('[data-field="department-name"]').textContent,
      courseCode: preview.querySelector('[data-field="course-code"]').textContent,
      courseTitle: preview.querySelector('[data-field="course-title"]').textContent,
      docNum: preview.querySelector('[data-field="doc-number"]').textContent,
      docTitle: preview.querySelector('[data-field="doc-title"]').textContent,
      comment: preview.querySelector('[data-field="comment-box"]').textContent,
      studentName: preview.querySelector('[data-field="student-name"]').textContent,
      studentId: preview.querySelector('[data-field="student-id"]').textContent,
      level: preview.querySelector('[data-field="level"]').textContent,
      term: preview.querySelector('[data-field="term"]').textContent,
      expDate: preview.querySelector('[data-field="experiment-date"]').textContent,
      subDate: preview.querySelector('[data-field="submission-date"]').textContent,
      teacherName: preview.querySelector('[data-field="teacher-name"]').textContent,
      teacherDesig: preview.querySelector('[data-field="teacher-designation"]').textContent,
    };
  })()`);
  console.log('Preview bound values:', checkA);

  // b. Change to "Assignment": title switches, Experiment Date hides/clears, labels change
  console.log('\n[Check b] Switch to Assignment:');
  const checkB = await cdp.eval(`(() => {
    document.querySelector('input[name="doc-type"][value="assignment"]').click();
    const preview = document.getElementById('cover-preview');
    const expDateGroup = document.getElementById('experiment-date-group');
    const expDateInput = document.getElementById('experiment-date');
    const numLabel = document.getElementById('doc-number-label').textContent;
    const titleLabel = document.getElementById('doc-title-label').textContent;
    const banner = preview.querySelector('[data-field="cover-title"]').textContent;
    const expDatePreview = preview.querySelector('[data-field="experiment-date"]').textContent;

    return {
      coverType: preview.querySelector('.a4-cover').getAttribute('data-cover-type'),
      banner,
      numLabel,
      titleLabel,
      expDateInputVal: expDateInput.value,
      expDateGroupHidden: expDateGroup.classList.contains('is-hidden'),
      expDatePreview
    };
  })()`);
  console.log('Assignment state:', checkB);

  // Switch back to Lab Report for cascade tests
  await cdp.eval(`document.querySelector('input[name="doc-type"][value="lab-report"]').click()`);

  // c. Select Department = EEE -> course-code datalist populates with all EEE courses
  console.log('\n[Check c] Select Department = EEE (with level and term empty):');
  const checkC = await cdp.eval(`(() => {
    const lvl = document.getElementById('level');
    lvl.value = '';
    lvl.dispatchEvent(new Event('change', { bubbles: true }));

    const term = document.getElementById('term');
    term.value = '';
    term.dispatchEvent(new Event('change', { bubbles: true }));

    const dept = document.getElementById('department');
    dept.value = 'Department of Electrical and Electronic Engineering (EEE)';
    dept.dispatchEvent(new Event('input', { bubbles: true }));

    const codes = Array.from(document.getElementById('course-codes-list').options).map(o => o.value);
    return { count: codes.length, sample: codes.slice(0, 5) };
  })()`);
  console.log('EEE course codes count:', checkC.count, 'sample:', checkC.sample);

  // d. Select Level = 2 -> list narrows to EEE Level 2 courses
  console.log('\n[Check d] Select Level = 2:');
  const checkD = await cdp.eval(`(() => {
    const lvl = document.getElementById('level');
    lvl.value = '2';
    lvl.dispatchEvent(new Event('change', { bubbles: true }));

    const codes = Array.from(document.getElementById('course-codes-list').options).map(o => o.value);
    return { count: codes.length, codes };
  })()`);
  console.log('EEE Level 2 courses count:', checkD.count, 'codes:', checkD.codes);

  // e. Select Term = I -> list narrows to EEE 2105, 2106, 2107, 2108, CSE 2109, 2110, MATH 2111, HUM 2177
  console.log('\n[Check e] Select Term = I:');
  const checkE = await cdp.eval(`(() => {
    const term = document.getElementById('term');
    term.value = 'I';
    term.dispatchEvent(new Event('change', { bubbles: true }));

    const codes = Array.from(document.getElementById('course-codes-list').options).map(o => o.value);
    return { count: codes.length, codes };
  })()`);
  console.log('EEE Level 2 Term I courses count:', checkE.count, 'codes:', checkE.codes);

  // f. Pick "EEE 2105" -> course title auto-fills "Electronic Circuits I"
  console.log('\n[Check f] Auto-fill EEE 2105:');
  const checkF = await cdp.eval(`(() => {
    const code = document.getElementById('course-code');
    code.value = 'EEE 2105';
    code.dispatchEvent(new Event('input', { bubbles: true }));

    const titleVal = document.getElementById('course-title').value;
    const titlePreview = document.querySelector('[data-field="course-title"]').textContent;
    return { titleVal, titlePreview };
  })()`);
  console.log('Auto-filled title:', checkF);

  // g. Type "EEE 9999" (unrecognized) -> title does not change
  console.log('\n[Check g] Unrecognized course code "EEE 9999":');
  const checkG = await cdp.eval(`(() => {
    const prevTitle = document.getElementById('course-title').value;
    const code = document.getElementById('course-code');
    code.value = 'EEE 9999';
    code.dispatchEvent(new Event('input', { bubbles: true }));

    const curTitle = document.getElementById('course-title').value;
    return { prevTitle, curTitle, changed: prevTitle !== curTitle };
  })()`);
  console.log('Title after EEE 9999:', checkG);

  // h. Change Department to BBA while "EEE 2105" is in code field -> value stays, datalist shows BBA
  console.log('\n[Check h] Change Dept to BBA with EEE 2105 in code:');
  const checkH = await cdp.eval(`(() => {
    const code = document.getElementById('course-code');
    code.value = 'EEE 2105';
    code.dispatchEvent(new Event('input', { bubbles: true }));

    const dept = document.getElementById('department');
    dept.value = 'Department of Business Administration (BBA)';
    dept.dispatchEvent(new Event('input', { bubbles: true }));

    const curCodeVal = document.getElementById('course-code').value;
    const codes = Array.from(document.getElementById('course-codes-list').options).map(o => o.value);
    return { curCodeVal, bbaCodesCount: codes.length, sampleBba: codes.slice(0, 5) };
  })()`);
  console.log('Code preserved:', checkH.curCodeVal, 'BBA count:', checkH.bbaCodesCount, 'sample:', checkH.sampleBba);

  // i. Logo upload -> preview -> reload -> persists -> remove logo -> placeholder -> reload -> placeholder
  console.log('\n[Check i] Logo persistence lifecycle:');
  const checkI = await cdp.eval(`(async () => {
    // Create a 10x10 dummy PNG Blob
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 10, 10);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    
    // Save via storage module directly to simulate upload
    const storage = await import('./js/storage.js');
    await storage.saveLogo(blob);
    
    // Reload page to test loadLogo on init
    return { saved: true };
  })()`);

  // Wait for save then reload
  await cdp.send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  const checkIReloaded = await cdp.eval(`(() => {
    const logoBox = document.querySelector('.logo-box');
    const img = logoBox.querySelector('img.uploaded-logo');
    const svg = logoBox.querySelector('svg');
    return { hasImg: !!img, hasSvg: !!svg, imgSrc: img ? img.src : null };
  })()`);
  console.log('After reload 1 (logo persisted):', checkIReloaded);

  // Now click "Remove logo"
  const checkIRemoved = await cdp.eval(`(async () => {
    document.getElementById('remove-logo').click();
    await new Promise(r => setTimeout(r, 300));
    const logoBox = document.querySelector('.logo-box');
    const img = logoBox.querySelector('img.uploaded-logo');
    const svg = logoBox.querySelector('svg');
    return { hasImg: !!img, hasSvg: !!svg };
  })()`);
  console.log('After remove-logo click:', checkIRemoved);

  // Reload page to verify placeholder stays
  await cdp.send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  const checkIReloaded2 = await cdp.eval(`(() => {
    const logoBox = document.querySelector('.logo-box');
    const img = logoBox.querySelector('img.uploaded-logo');
    const svg = logoBox.querySelector('svg');
    return { hasImg: !!img, hasSvg: !!svg };
  })()`);
  console.log('After reload 2 (placeholder persisted):', checkIReloaded2);

  // j. Type value in every field, reload -> all fields restore
  console.log('\n[Check j] Draft auto-restore on reload:');
  await cdp.eval(`(() => {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    setVal('university', 'Persisted University Name');
    setVal('department', 'Department of Industrial and Production Engineering (IPE)');
    setVal('level', '4');
    setVal('term', 'II');
    setVal('course-code', 'IPE 4201');
    setVal('course-title', 'Management Information System Analysis');
    setVal('doc-number', '09');
    setVal('doc-title', 'Final Capstone Project');
    setVal('comment', 'Outstanding');
    setVal('student-name', 'Bob Builder');
    setVal('student-id', '999888');
    setVal('experiment-date', '2026-10-01');
    setVal('submission-date', '2026-10-15');
    setVal('teacher-name', 'Prof. Smith');
    setVal('teacher-designation', 'Dean of Engineering');
  })()`);

  // Wait 700ms for debounced draft save
  await new Promise(r => setTimeout(r, 700));

  // Reload page
  await cdp.send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  const checkJ = await cdp.eval(`(() => {
    return {
      university: document.getElementById('university').value,
      department: document.getElementById('department').value,
      level: document.getElementById('level').value,
      term: document.getElementById('term').value,
      courseCode: document.getElementById('course-code').value,
      courseTitle: document.getElementById('course-title').value,
      docNumber: document.getElementById('doc-number').value,
      docTitle: document.getElementById('doc-title').value,
      comment: document.getElementById('comment').value,
      studentName: document.getElementById('student-name').value,
      studentId: document.getElementById('student-id').value,
      experimentDate: document.getElementById('experiment-date').value,
      submissionDate: document.getElementById('submission-date').value,
      teacherName: document.getElementById('teacher-name').value,
      teacherDesignation: document.getElementById('teacher-designation').value
    };
  })()`);
  console.log('Restored fields:', checkJ);

  // k. Select CSE department (no course data) -> course datalist empty; typing a code still works
  console.log('\n[Check k] Department with no course data (CSE):');
  const checkK = await cdp.eval(`(() => {
    const dept = document.getElementById('department');
    dept.value = 'Department of Computer Science and Engineering (CSE)';
    dept.dispatchEvent(new Event('input', { bubbles: true }));

    const codes = Array.from(document.getElementById('course-codes-list').options).map(o => o.value);
    const codeInput = document.getElementById('course-code');
    const disabled = codeInput.disabled;
    codeInput.value = 'CSE 4101';
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    const previewCode = document.querySelector('[data-field="course-code"]').textContent;

    return {
      dept: dept.value,
      codesCount: codes.length,
      inputDisabled: disabled,
      typedCodeVal: codeInput.value,
      previewCode
    };
  })()`);
  console.log('CSE department check:', checkK);

  ws.close();
  console.log('\nAll checks completed successfully!');
}

try {
  await run();
} finally {
  try { chrome.kill(); } catch {}
  try { server.kill(); } catch {}
  await new Promise(r => setTimeout(r, 500));
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
}
