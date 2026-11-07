import http from 'node:http';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/dev-server.js'], { env: { ...process.env, PORT: '5173' } });
await new Promise(r => setTimeout(r, 1000));

async function fetchHttp(urlPath) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:5173' + urlPath, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body: data }));
    }).on('error', reject);
  });
}

try {
  console.log('=== PHASE 6 HTTP CHECKS ===');
  const r1 = await fetchHttp('/create.html');
  console.log('GET /create.html:', r1.status, r1.type, 'has print-cover:', r1.body.includes('id="print-cover"'));
  if (r1.status !== 200 || !r1.body.includes('id="print-cover"')) throw new Error('GET /create.html failed');

  const r2 = await fetchHttp('/css/print.css');
  console.log('GET /css/print.css:', r2.status, r2.type, 'bytes:', r2.body.length);
  if (r2.status !== 200 || !r2.type.includes('text/css')) throw new Error('GET /css/print.css failed');

  const r3 = await fetchHttp('/../reference/lab-report-demo.pdf');
  console.log('GET /../reference/lab-report-demo.pdf:', r3.status);
  if (r3.status !== 404) throw new Error('Traversal 1 failed');

  const r4 = await fetchHttp('/../reference/quick_cover_ui_reference.html');
  console.log('GET /../reference/quick_cover_ui_reference.html:', r4.status);
  if (r4.status !== 404) throw new Error('Traversal 2 failed');

  console.log('All HTTP checks passed successfully!');
} finally {
  server.kill();
}
