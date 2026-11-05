import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-p5-'));

// Start Dev Server
const server = spawn('node', ['scripts/dev-server.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '5173' }
});

await new Promise(r => setTimeout(r, 1000));

// Start Chrome
const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9229',
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
  console.log('=== PHASE 5: PERSISTENCE POLISH AUTOMATED INTERACTION SUITE ===\n');

  const tabsRes = await fetch('http://127.0.0.1:9229/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
  const cdpA = await connectToWs(pageTab.webSocketDebuggerUrl);

  await cdpA.send('Page.enable');
  await cdpA.send('Runtime.enable');

  // Handle native window.confirm dialogs automatically
  let lastDialogMessage = '';
  cdpA.on('Page.javascriptDialogOpening', async (params) => {
    lastDialogMessage = params.message;
    await cdpA.send('Page.handleJavaScriptDialog', { accept: true });
  });

  // Navigate Tab A to create.html
  await cdpA.send('Page.navigate', { url: 'http://127.0.0.1:5173/create.html' });
  await new Promise(r => setTimeout(r, 1000));

  // ---------------------------------------------------------------------------
  // Step 1: Fill all fields, wait for debounced save, reload -> draft restores,
  // status line shows "Draft restored."
  // ---------------------------------------------------------------------------
  await cdpA.eval(`
    (() => {
      document.getElementById('university').value = 'Test University';
      document.getElementById('university').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('department').value = 'Department of Computer Science';
      document.getElementById('department').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('student-name').value = 'John Doe';
      document.getElementById('student-name').dispatchEvent(new Event('input', { bubbles: true }));

      document.getElementById('student-id').value = '190104001';
      document.getElementById('student-id').dispatchEvent(new Event('input', { bubbles: true }));

      const row1 = document.querySelector('.teacher-row');
      row1.querySelector('.t-role').value = 'Lead Instructor';
      row1.querySelector('.t-role').dispatchEvent(new Event('input', { bubbles: true }));
      row1.querySelector('.t-name').value = 'Dr. Test Professor';
      row1.querySelector('.t-name').dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);

  // Wait for 500ms debounce save + margin
  await new Promise(r => setTimeout(r, 700));

  // Reload page
  await cdpA.send('Page.reload');
  await new Promise(r => setTimeout(r, 1000));

  const res1 = await cdpA.eval(`
    (() => {
      const u = document.getElementById('university').value;
      const n = document.getElementById('student-name').value;
      const status = document.getElementById('storage-status').textContent;
      const tRow = document.querySelector('.teacher-row');
      const tName = tRow ? tRow.querySelector('.t-name').value : '';
      return { u, n, tName, status };
    })()
  `);

  if (
    res1 &&
    res1.u === 'Test University' &&
    res1.n === 'John Doe' &&
    res1.tName === 'Dr. Test Professor' &&
    res1.status.includes('Draft restored')
  ) {
    console.log(`[PASS] Step 1: Draft restores on reload with status "${res1.status}"`);
  } else {
    throw new Error(`[FAIL] Step 1: Failed to restore draft on reload: ${JSON.stringify(res1)}`);
  }

  // ---------------------------------------------------------------------------
  // Step 2: Click "Start over" -> confirm dialog is triggered, all fields clear,
  // localStorage draft removed, status shows "Cleared.", teachers array reset.
  // ---------------------------------------------------------------------------
  await cdpA.eval(`document.getElementById('clear-form').click()`);
  await new Promise(r => setTimeout(r, 500));

  const res2 = await cdpA.eval(`
    (() => {
      const u = document.getElementById('university').value;
      const n = document.getElementById('student-name').value;
      const status = document.getElementById('storage-status').textContent;
      const rows = document.querySelectorAll('.teacher-row');
      const draftInLs = localStorage.getItem('covercraft-draft-v1');
      return { u, n, rowsCount: rows.length, status, draftInLs };
    })()
  `);

  if (
    res2 &&
    res2.u === '' &&
    res2.n === '' &&
    res2.rowsCount === 1 &&
    res2.draftInLs === null &&
    res2.status === 'Cleared.' &&
    lastDialogMessage.includes('Clear all fields')
  ) {
    console.log(`[PASS] Step 2: "Start over" clears form and draft with confirmation dialog`);
  } else {
    throw new Error(`[FAIL] Step 2: Reset assertion failed: ${JSON.stringify(res2)}`);
  }

  // ---------------------------------------------------------------------------
  // Step 3: Corrupt the draft -> "{not json", reload -> form is blank,
  // status shows "Previous draft could not be restored.", no exception thrown.
  // ---------------------------------------------------------------------------
  await cdpA.eval(`localStorage.setItem('covercraft-draft-v1', '{corrupt json')`);

  await cdpA.send('Page.reload');
  await new Promise(r => setTimeout(r, 1000));

  const res3 = await cdpA.eval(`
    (() => {
      const u = document.getElementById('university').value;
      const status = document.getElementById('storage-status').textContent;
      const draftInLs = localStorage.getItem('covercraft-draft-v1');
      return { u, status, draftInLs };
    })()
  `);

  if (
    res3 &&
    res3.u === '' &&
    res3.status === 'Previous draft could not be restored.' &&
    res3.draftInLs === null
  ) {
    console.log(`[PASS] Step 3: Corrupt JSON handled gracefully, cleared, status="${res3.status}"`);
  } else {
    throw new Error(`[FAIL] Step 3: Corrupt JSON handling failed: ${JSON.stringify(res3)}`);
  }

  // ---------------------------------------------------------------------------
  // Step 4: Quota simulation: monkey-patch localStorage.setItem to throw
  // QuotaExceededError during a field edit -> status shows storage full;
  // form remains usable; typing again with restored setItem retries successfully.
  // ---------------------------------------------------------------------------
  await cdpA.eval(`
    (() => {
      const origSetItem = localStorage.setItem.bind(localStorage);
      window.__origSetItem = origSetItem;
      localStorage.setItem = function(k, v) {
        if (k === 'covercraft-draft-v1') {
          const err = new Error('Quota exceeded');
          err.name = 'QuotaExceededError';
          err.code = 22;
          throw err;
        }
        return origSetItem(k, v);
      };

      // Type into field
      const univ = document.getElementById('university');
      univ.value = 'Quota Test University';
      univ.dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);

  // Wait for debounced save attempt
  await new Promise(r => setTimeout(r, 700));

  const res4Msg = await cdpA.eval(`document.getElementById('storage-status').textContent`);

  if (res4Msg && res4Msg.includes('Storage full')) {
    console.log(`[PASS] Step 4a: QuotaExceededError caught and surfaced: "${res4Msg}"`);
  } else {
    throw new Error(`[FAIL] Step 4a: QuotaExceededError not surfaced: "${res4Msg}"`);
  }

  // Restore setItem and verify form is still usable
  await cdpA.eval(`
    (() => {
      localStorage.setItem = window.__origSetItem;
      const univ = document.getElementById('university');
      univ.value = 'Recovered University';
      univ.dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);
  await new Promise(r => setTimeout(r, 700));

  const res4b = await cdpA.eval(`
    (() => ({
      status: document.getElementById('storage-status').textContent,
      saved: JSON.parse(localStorage.getItem('covercraft-draft-v1') || '{}').university
    }))()
  `);

  if (
    res4b &&
    res4b.status === 'Draft saved.' &&
    res4b.saved === 'Recovered University'
  ) {
    console.log(`[PASS] Step 4b: Form recovered seamlessly after quota resolution`);
  } else {
    throw new Error(`[FAIL] Step 4b: Form did not recover after quota: ${JSON.stringify(res4b)}`);
  }

  // ---------------------------------------------------------------------------
  // Step 5: Cross-Tab Synchronization
  // Open Tab B via CDP Target.createTarget
  // Tab A types -> Tab B updates live. Tab B clears -> Tab A notified without losing data.
  // ---------------------------------------------------------------------------
  const { targetId } = await cdpA.send('Target.createTarget', {
    url: 'http://127.0.0.1:5173/create.html'
  });

  const tabsAfterRes = await fetch('http://127.0.0.1:9229/json');
  const allTabs = await tabsAfterRes.json();
  const tabBInfo = allTabs.find(t => t.id === targetId);
  const cdpB = await connectToWs(tabBInfo.webSocketDebuggerUrl);

  await cdpB.send('Page.enable');
  await cdpB.send('Runtime.enable');
  cdpB.on('Page.javascriptDialogOpening', async () => {
    await cdpB.send('Page.handleJavaScriptDialog', { accept: true });
  });

  // Tab B loads draft saved from Tab A
  await new Promise(r => setTimeout(r, 800));

  // Now, in Tab A, type a new student name
  await cdpA.eval(`
    (() => {
      const el = document.getElementById('student-name');
      el.value = 'Cross Tab Alice';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);

  // Wait for Tab A save + Tab B storage event processing
  await new Promise(r => setTimeout(r, 800));

  const resTabB = await cdpB.eval(`
    (() => ({
      name: document.getElementById('student-name').value,
      status: document.getElementById('storage-status').textContent,
      previewName: document.querySelector('[data-field="student-name"]').textContent
    }))()
  `);

  if (
    resTabB &&
    resTabB.name === 'Cross Tab Alice' &&
    resTabB.previewName === 'Cross Tab Alice' &&
    resTabB.status === 'Draft updated from another tab.'
  ) {
    console.log(`[PASS] Step 5a: Tab B received remote update from Tab A: "${resTabB.status}"`);
  } else {
    throw new Error(`[FAIL] Step 5a: Cross-tab update did not propagate to Tab B: ${JSON.stringify(resTabB)}`);
  }

  // Now, in Tab B, clear the draft via clear-form
  await cdpB.eval(`document.getElementById('clear-form').click()`);
  await new Promise(r => setTimeout(r, 600));

  // Check Tab A: should surface "Draft was cleared in another tab." and NOT wipe its in-memory form
  const resTabAAfterClear = await cdpA.eval(`
    (() => ({
      name: document.getElementById('student-name').value,
      status: document.getElementById('storage-status').textContent
    }))()
  `);

  if (
    resTabAAfterClear &&
    resTabAAfterClear.status === 'Draft was cleared in another tab.' &&
    resTabAAfterClear.name === 'Cross Tab Alice'
  ) {
    console.log(`[PASS] Step 5b: Tab A notified of remote clear without losing in-memory work`);
  } else {
    throw new Error(`[FAIL] Step 5b: Tab A handling of remote clear failed: ${JSON.stringify(resTabAAfterClear)}`);
  }

  // ---------------------------------------------------------------------------
  // Step 6: Verify Reset clears teachers back to a single empty entry
  // ---------------------------------------------------------------------------
  await cdpA.eval(`
    (() => {
      document.getElementById('add-teacher').click();
      document.getElementById('add-teacher').click();
    })()
  `);
  await new Promise(r => setTimeout(r, 300));

  const multiRowCheck = await cdpA.eval(`document.querySelectorAll('.teacher-row').length`);

  if (multiRowCheck !== 3) {
    throw new Error(`Expected 3 teacher rows before reset, got ${multiRowCheck}`);
  }

  await cdpA.eval(`document.getElementById('clear-form').click()`);
  await new Promise(r => setTimeout(r, 400));

  const resetRowsCheck = await cdpA.eval(`
    (() => {
      const rows = document.querySelectorAll('.teacher-row');
      const rmBtn = rows[0] ? rows[0].querySelector('.t-remove') : null;
      return {
        count: rows.length,
        disabled: rmBtn ? rmBtn.disabled : false
      };
    })()
  `);

  if (resetRowsCheck && resetRowsCheck.count === 1 && resetRowsCheck.disabled === true) {
    console.log(`[PASS] Step 6: Reset restored teachers to 1 empty entry with disabled remove button`);
  } else {
    throw new Error(`[FAIL] Step 6: Reset teachers check failed: ${JSON.stringify(resetRowsCheck)}`);
  }

  console.log('\n=== TEST SUITE SUMMARY: ALL 6 STEPS PASSED ===\n');

  cdpA.ws.close();
  cdpB.ws.close();

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
