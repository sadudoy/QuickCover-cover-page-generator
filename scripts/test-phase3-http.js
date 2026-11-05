import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const serverProcess = spawn('node', ['scripts/dev-server.js'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  env: { ...process.env, PORT: '5173' }
});

// Wait for server to start
await new Promise(r => setTimeout(r, 1000));

async function fetchHttp(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:5173${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          bodyLength: data.length,
          preview: data.slice(0, 80)
        });
      });
    });
    req.on('error', reject);
  });
}

try {
  console.log('--- Phase 3 HTTP Verification ---');

  const checks = [
    '/create.html',
    '/data/dropdowns.json',
    '/js/create.js',
    '/js/storage.js',
    '/css/form.css',
    '/../reference/lab-report-demo.pdf'
  ];

  for (const p of checks) {
    const res = await fetchHttp(p);
    console.log(`GET ${p} -> ${res.statusCode} (content-type: ${res.contentType || 'none'}, bytes: ${res.bodyLength})`);
  }
} finally {
  serverProcess.kill();
}
