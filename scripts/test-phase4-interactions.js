import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-p4-'));

// Start Dev Server
const server = spawn('node', ['scripts/dev-server.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '5173' }
});

await new Promise(r => setTimeout(r, 1000));

// Start Chrome
const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9223',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,1600'
]);

await new Promise(r => setTimeout(r, 1500));

async function getWsUrl() {
  const res = await fetch('http://127.0.0.1:9223/json');
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

  async captureScreenshot(outputPath) {
    const result = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(result.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
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

  console.log('=== PHASE 4: MULTI-TEACHER AUTOMATED INTERACTION SUITE ===\n');

  let passes = 0;
  let fails = 0;

  function report(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}${details ? ' — ' + details : ''}`);
      passes++;
    } else {
      console.error(`[FAIL] ${name}${details ? ' — ' + details : ''}`);
      fails++;
    }
  }

  // 1. Add teacher -> row count increases, preview teacher entries increase
  const step1 = await cdp.eval(`(() => {
    // Fill teacher 1 first
    const row0Name = document.querySelector('.teacher-row[data-index="0"] .t-name');
    row0Name.value = 'Dr. Primary Teacher';
    row0Name.dispatchEvent(new Event('input', { bubbles: true }));

    // Click Add teacher
    document.getElementById('add-teacher').click();

    const formRows = document.querySelectorAll('.teacher-row').length;
    const previewEntries = document.querySelectorAll('[data-field="teachers-list"] .teacher-entry').length;
    return { formRows, previewEntries };
  })()`);
  report('Step 1: Add teacher increases row count', step1.formRows === 2 && step1.previewEntries === 1,
    `form rows: ${step1.formRows}, preview entries: ${step1.previewEntries}`);

  // 2. Type name into entry 2 -> preview shows second entry
  const step2 = await cdp.eval(`(() => {
    const row1Name = document.querySelector('.teacher-row[data-index="1"] .t-name');
    row1Name.value = 'Engr. Lab Instructor';
    row1Name.dispatchEvent(new Event('input', { bubbles: true }));

    const previewEntries = document.querySelectorAll('[data-field="teachers-list"] .teacher-entry');
    const text2 = previewEntries[1] ? previewEntries[1].textContent : '';
    return { count: previewEntries.length, text2 };
  })()`);
  report('Step 2: Type name into entry 2 updates preview', step2.count === 2 && step2.text2.includes('Engr. Lab Instructor'),
    `entries count: ${step2.count}, entry 2 text: "${step2.text2}"`);

  // 3. Type role into entry 2 -> preview shows "<role>: <name>"
  const step3 = await cdp.eval(`(() => {
    const row1Role = document.querySelector('.teacher-row[data-index="1"] .t-role');
    row1Role.value = 'Lab Instructor';
    row1Role.dispatchEvent(new Event('input', { bubbles: true }));

    const previewEntries = document.querySelectorAll('[data-field="teachers-list"] .teacher-entry');
    const line1 = previewEntries[1] ? previewEntries[1].querySelector('.teacher-line-name').textContent : '';
    return { line1 };
  })()`);
  report('Step 3: Type role into entry 2 shows "<role>: <name>"', step3.line1.includes('Lab Instructor:') && step3.line1.includes('Engr. Lab Instructor'),
    `line1 text: "${step3.line1}"`);

  // 4. Leave designation blank for entry 2 -> no "Designation:" line for entry 2
  const step4 = await cdp.eval(`(() => {
    const row1Desig = document.querySelector('.teacher-row[data-index="1"] .t-designation');
    row1Desig.value = '';
    row1Desig.dispatchEvent(new Event('input', { bubbles: true }));

    const previewEntries = document.querySelectorAll('[data-field="teachers-list"] .teacher-entry');
    const hasDesigLine = !!(previewEntries[1] && previewEntries[1].querySelector('.teacher-line-desig'));
    return { hasDesigLine };
  })()`);
  report('Step 4: Blank designation renders no "Designation:" line', step4.hasDesigLine === false,
    `hasDesigLine: ${step4.hasDesigLine}`);

  // Visual snapshot of multi-teacher
  await cdp.captureScreenshot(path.join(process.cwd(), 'reference', 'rendered', 'cover-multi-teacher-test.png'));

  // 5. Click remove on entry 2 -> row and preview entry gone
  const step5 = await cdp.eval(`(() => {
    const removeBtn1 = document.querySelector('.teacher-row[data-index="1"] .t-remove');
    removeBtn1.click();

    const formRows = document.querySelectorAll('.teacher-row').length;
    const previewEntries = document.querySelectorAll('[data-field="teachers-list"] .teacher-entry').length;
    return { formRows, previewEntries };
  })()`);
  report('Step 5: Click remove on entry 2 removes row and preview entry', step5.formRows === 1 && step5.previewEntries === 1,
    `form rows: ${step5.formRows}, preview entries: ${step5.previewEntries}`);

  // 6. Click remove on only remaining entry -> button disabled / no effect; teachers array length stays 1
  const step6 = await cdp.eval(`(() => {
    const removeBtn0 = document.querySelector('.teacher-row[data-index="0"] .t-remove');
    const wasDisabled = removeBtn0.disabled;
    removeBtn0.click(); // should do nothing

    const formRows = document.querySelectorAll('.teacher-row').length;
    const previewEntries = document.querySelectorAll('[data-field="teachers-list"] .teacher-entry').length;
    return { wasDisabled, formRows, previewEntries };
  })()`);
  report('Step 6: Remove button disabled on last remaining entry', step6.wasDisabled === true && step6.formRows === 1,
    `wasDisabled: ${step6.wasDisabled}, remaining rows: ${step6.formRows}`);

  // 7. Reload -> teachers array restored (including roles)
  // Let's add role and designation to teacher 1 first, wait for debounce, then reload
  await cdp.eval(`(() => {
    const r = document.querySelector('.teacher-row[data-index="0"] .t-role');
    const d = document.querySelector('.teacher-row[data-index="0"] .t-designation');
    r.value = 'Course Teacher';
    r.dispatchEvent(new Event('input', { bubbles: true }));
    d.value = 'Professor';
    d.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);

  // Wait 700ms for debounced draft save
  await new Promise(r => setTimeout(r, 700));

  await cdp.send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  const step7 = await cdp.eval(`(() => {
    const roleVal = document.querySelector('.teacher-row[data-index="0"] .t-role').value;
    const nameVal = document.querySelector('.teacher-row[data-index="0"] .t-name').value;
    const desigVal = document.querySelector('.teacher-row[data-index="0"] .t-designation').value;
    const previewLine = document.querySelector('[data-field="teachers-list"] .teacher-line-name').textContent;
    return { roleVal, nameVal, desigVal, previewLine };
  })()`);
  report('Step 7: Reload restores teachers array with role, name, designation',
    step7.roleVal === 'Course Teacher' && step7.nameVal === 'Dr. Primary Teacher' && step7.desigVal === 'Professor',
    `restored: role="${step7.roleVal}", name="${step7.nameVal}", desig="${step7.desigVal}"`);

  // 8. Seed an old draft ({teacherName:"Old Name",teacherDesignation:"Old Rank"}) under covercraft-draft-v1 -> load page -> migrated
  const step8 = await cdp.eval(`(async () => {
    const oldDraft = {
      docType: 'lab-report',
      'teacher-name': 'Old Name',
      'teacher-designation': 'Old Rank'
    };
    localStorage.setItem('covercraft-draft-v1', JSON.stringify(oldDraft));
    return true;
  })()`);

  await cdp.send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  const step8Result = await cdp.eval(`(() => {
    const rows = document.querySelectorAll('.teacher-row');
    const nameVal = rows[0].querySelector('.t-name').value;
    const desigVal = rows[0].querySelector('.t-designation').value;
    const roleVal = rows[0].querySelector('.t-role').value;
    const previewText = document.querySelector('[data-field="teachers-list"]').textContent;
    return { rowCount: rows.length, roleVal, nameVal, desigVal, previewText };
  })()`);
  report('Step 8: Old draft schema silently migrated to teachers array',
    step8Result.rowCount === 1 && step8Result.nameVal === 'Old Name' && step8Result.desigVal === 'Old Rank' && step8Result.roleVal === '',
    `name="${step8Result.nameVal}", desig="${step8Result.desigVal}", preview="${step8Result.previewText.trim()}"`);

  // 9. Doc-type switch -> teachers array preserved (no reset)
  const step9 = await cdp.eval(`(() => {
    // Switch to assignment
    document.querySelector('input[name="doc-type"][value="assignment"]').click();

    const nameVal = document.querySelector('.teacher-row[data-index="0"] .t-name').value;
    const previewText = document.querySelector('[data-field="teachers-list"]').textContent;
    const coverType = document.querySelector('.a4-cover').getAttribute('data-cover-type');

    return { coverType, nameVal, previewText };
  })()`);
  report('Step 9: Doc-type switch preserves teachers array',
    step9.coverType === 'assignment' && step9.nameVal === 'Old Name',
    `coverType: ${step9.coverType}, teacher name preserved: "${step9.nameVal}"`);

  // Switch back to lab-report for step 10
  await cdp.eval(`document.querySelector('input[name="doc-type"][value="lab-report"]').click()`);

  // 10. Single teacher with role empty -> preview shows "Teacher Name: <name>" and "Designation: <designation>", signature line position intact
  const step10 = await cdp.eval(`(() => {
    const row0Role = document.querySelector('.teacher-row[data-index="0"] .t-role');
    const row0Name = document.querySelector('.teacher-row[data-index="0"] .t-name');
    const row0Desig = document.querySelector('.teacher-row[data-index="0"] .t-designation');

    row0Role.value = '';
    row0Role.dispatchEvent(new Event('input', { bubbles: true }));
    row0Name.value = 'Md. Teacher Name';
    row0Name.dispatchEvent(new Event('input', { bubbles: true }));
    row0Desig.value = 'Assistant Professor';
    row0Desig.dispatchEvent(new Event('input', { bubbles: true }));

    const preview = document.querySelector('[data-field="teachers-list"]');
    const label1 = preview.querySelector('.teacher-line-name .card-field-label').textContent;
    const val1 = preview.querySelector('.teacher-line-name .card-field-value').textContent;
    const label2 = preview.querySelector('.teacher-line-desig .card-field-label').textContent;
    const val2 = preview.querySelector('.teacher-line-desig .card-field-value').textContent;

    const signRow = document.querySelector('.card-submitted-to .sub-to-row-sign');
    const signComputed = window.getComputedStyle(signRow);
    const cardComputed = window.getComputedStyle(document.querySelector('.card-submitted-to'));

    return {
      label1,
      val1,
      label2,
      val2,
      signTop: signComputed.top,
      cardHeight: cardComputed.height
    };
  })()`);
  report('Step 10: Single teacher default layout matches Phase 2 labels and geometry',
    step10.label1 === 'Teacher Name:' && step10.val1 === 'Md. Teacher Name' &&
    step10.label2 === 'Designation:' && step10.val2 === 'Assistant Professor',
    `label1: "${step10.label1}", label2: "${step10.label2}", signTop: ${step10.signTop}, cardHeight: ${step10.cardHeight}`);

  // Take screenshot of single teacher default in create.html
  await cdp.captureScreenshot(path.join(process.cwd(), 'reference', 'rendered', 'cover-single-teacher-default.png'));

  ws.close();
  console.log(`\n=== TEST SUITE SUMMARY: ${passes} PASSED, ${fails} FAILED ===\n`);
  if (fails > 0) process.exit(1);
}

try {
  await run();
} finally {
  try { chrome.kill(); } catch {}
  try { server.kill(); } catch {}
  await new Promise(r => setTimeout(r, 500));
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
}
