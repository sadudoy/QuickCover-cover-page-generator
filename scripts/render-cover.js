import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const WINDOWS_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const UNIX_CANDIDATES = [
  'google-chrome',
  'chromium',
  'chromium-browser',
  'msedge'
];

function findBrowserBinary() {
  const isWindows = process.platform === 'win32';
  const candidates = isWindows ? WINDOWS_CANDIDATES : UNIX_CANDIDATES;

  for (const candidate of candidates) {
    if (isWindows) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } else {
      try {
        // Simple check if executable in PATH
        return candidate;
      } catch {
        // continue
      }
    }
  }
  return isWindows ? WINDOWS_CANDIDATES[0] : 'google-chrome';
}

const browser = findBrowserBinary();
const clientDir = path.join(ROOT_DIR, 'client').replace(/\\/g, '/');
const renderedDir = path.join(ROOT_DIR, 'reference', 'rendered').replace(/\\/g, '/');

const labHtml = `file:///${clientDir}/cover-lab.html`;
const assignmentHtml = `file:///${clientDir}/cover-assignment.html`;

const labScreenshot = `${renderedDir}/cover-lab-static.png`;
const assignmentScreenshot = `${renderedDir}/cover-assignment-static.png`;

// At 96 DPI, A4 (210mm x 297mm) is ~794 x 1123 px.
const labCmd = `"${browser}" --headless=new --disable-gpu --hide-scrollbars --window-size=794,1123 --screenshot="${labScreenshot}" "${labHtml}"`;
const assignmentCmd = `"${browser}" --headless=new --disable-gpu --hide-scrollbars --window-size=794,1123 --screenshot="${assignmentScreenshot}" "${assignmentHtml}"`;

console.log('=== Cover Page Generator: Static Page Render Commands ===');
console.log(`Detected Browser: ${browser}\n`);

console.log('[1] Render Lab Report Static Cover:');
console.log(labCmd);
console.log('\n[2] Render Assignment Static Cover:');
console.log(assignmentCmd);

export { findBrowserBinary, labCmd, assignmentCmd };
