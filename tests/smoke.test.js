import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/* Phase 1 & 4.5: Foundation & Landing Page Smoke Assertions */

test('smoke: client/index.html exists and contains an <h1>', () => {
  const htmlPath = path.join(ROOT_DIR, 'client', 'index.html');
  assert.equal(fs.existsSync(htmlPath), true, 'client/index.html must exist');

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  assert.match(htmlContent, /<h1\b[^>]*>/i, 'client/index.html must contain an <h1>');
});

test('smoke: client/index.html links to css/site.css and css/landing.css', () => {
  const htmlPath = path.join(ROOT_DIR, 'client', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  assert.match(
    htmlContent,
    /<link[^>]+href=["'][^"']*css\/site\.css["']/i,
    'client/index.html must link css/site.css'
  );
  assert.match(
    htmlContent,
    /<link[^>]+href=["'][^"']*css\/landing\.css["']/i,
    'client/index.html must link css/landing.css'
  );
});

test('smoke: client/index.html contains href="create.html"', () => {
  const htmlPath = path.join(ROOT_DIR, 'client', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  assert.match(
    htmlContent,
    /href=["']create\.html["']/,
    'client/index.html must contain a link to create.html'
  );
});

test('smoke: client/index.html includes a <script type="module" src="js/site.js"> tag', () => {
  const htmlPath = path.join(ROOT_DIR, 'client', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  assert.match(
    htmlContent,
    /<script[^>]+type=["']module["'][^>]+src=["'][^"']*site\.js["']/i,
    'client/index.html must include a script tag with type="module" referencing site.js'
  );
});

test('smoke: scripts/dev-server.js exists', () => {
  const serverPath = path.join(ROOT_DIR, 'scripts', 'dev-server.js');
  assert.equal(fs.existsSync(serverPath), true, 'scripts/dev-server.js must exist');
});

test('smoke: reference directory exists', () => {
  const refDir = path.join(ROOT_DIR, 'reference');
  assert.equal(fs.existsSync(refDir), true, 'reference/ directory must exist');
});

test('smoke: reference PDF(s) exist', () => {
  const labReportPath = path.join(ROOT_DIR, 'reference', 'lab-report-demo.pdf');
  const assignmentPath = path.join(ROOT_DIR, 'reference', 'assignment-demo.pdf');

  const labReportExists = fs.existsSync(labReportPath);
  const assignmentExists = fs.existsSync(assignmentPath);

  assert.equal(
    labReportExists || assignmentExists,
    true,
    'At least one reference PDF must be present in reference/'
  );

  if (labReportExists && assignmentExists) {
    assert.equal(labReportExists, true, 'reference/lab-report-demo.pdf must exist');
    assert.equal(assignmentExists, true, 'reference/assignment-demo.pdf must exist');
  }
});

test('smoke: lab-report rendered PNG is up-to-date with lab-report PDF', () => {
  const labReportPdf = path.join(ROOT_DIR, 'reference', 'lab-report-demo.pdf');
  const labReportPng = path.join(ROOT_DIR, 'reference', 'rendered', 'lab-report-page-1.png');

  assert.equal(fs.existsSync(labReportPdf), true, 'reference/lab-report-demo.pdf must exist');
  assert.equal(fs.existsSync(labReportPng), true, 'reference/rendered/lab-report-page-1.png must exist');

  const pdfMtime = fs.statSync(labReportPdf).mtimeMs;
  const pngMtime = fs.statSync(labReportPng).mtimeMs;

  assert.equal(
    pngMtime >= pdfMtime,
    true,
    'Rendered PNG mtime must be greater than or equal to PDF mtime'
  );
});

/* Phase 2: Static Cover Template Smoke Assertions */

test('smoke: client/css/cover.css exists', () => {
  const cssPath = path.join(ROOT_DIR, 'client', 'css', 'cover.css');
  assert.equal(fs.existsSync(cssPath), true, 'client/css/cover.css must exist');
});

test('smoke: client/cover-lab.html and client/cover-assignment.html exist', () => {
  const labPath = path.join(ROOT_DIR, 'client', 'cover-lab.html');
  const assignmentPath = path.join(ROOT_DIR, 'client', 'cover-assignment.html');

  assert.equal(fs.existsSync(labPath), true, 'client/cover-lab.html must exist');
  assert.equal(fs.existsSync(assignmentPath), true, 'client/cover-assignment.html must exist');
});

test('smoke: each cover HTML links to css/cover.css', () => {
  const labPath = path.join(ROOT_DIR, 'client', 'cover-lab.html');
  const assignmentPath = path.join(ROOT_DIR, 'client', 'cover-assignment.html');

  const labHtml = fs.readFileSync(labPath, 'utf-8');
  const assignmentHtml = fs.readFileSync(assignmentPath, 'utf-8');

  assert.match(labHtml, /<link[^>]+href=["'][^"']*css\/cover\.css["']/i, 'Lab cover must link css/cover.css');
  assert.match(assignmentHtml, /<link[^>]+href=["'][^"']*css\/cover\.css["']/i, 'Assignment cover must link css/cover.css');
});

test('smoke: each cover HTML contains class="a4-cover" with correct data-cover-type value', () => {
  const labPath = path.join(ROOT_DIR, 'client', 'cover-lab.html');
  const assignmentPath = path.join(ROOT_DIR, 'client', 'cover-assignment.html');

  const labHtml = fs.readFileSync(labPath, 'utf-8');
  const assignmentHtml = fs.readFileSync(assignmentPath, 'utf-8');

  assert.match(
    labHtml,
    /class=["'][^"']*\ba4-cover\b[^"']*["'][^>]*data-cover-type=["']lab-report["']|data-cover-type=["']lab-report["'][^>]*class=["'][^"']*\ba4-cover\b[^"']*["']/i,
    'Lab cover must carry class="a4-cover" and data-cover-type="lab-report"'
  );

  assert.match(
    assignmentHtml,
    /class=["'][^"']*\ba4-cover\b[^"']*["'][^>]*data-cover-type=["']assignment["']|data-cover-type=["']assignment["'][^>]*class=["'][^"']*\ba4-cover\b[^"']*["']/i,
    'Assignment cover must carry class="a4-cover" and data-cover-type="assignment"'
  );
});

test('smoke: each cover HTML contains "Submitted By" and "Submitted To"', () => {
  const labPath = path.join(ROOT_DIR, 'client', 'cover-lab.html');
  const assignmentPath = path.join(ROOT_DIR, 'client', 'cover-assignment.html');

  const labHtml = fs.readFileSync(labPath, 'utf-8');
  const assignmentHtml = fs.readFileSync(assignmentPath, 'utf-8');

  assert.match(labHtml, /Submitted By/i, 'Lab cover must contain "Submitted By"');
  assert.match(labHtml, /Submitted To/i, 'Lab cover must contain "Submitted To"');
  assert.match(assignmentHtml, /Submitted By/i, 'Assignment cover must contain "Submitted By"');
  assert.match(assignmentHtml, /Submitted To/i, 'Assignment cover must contain "Submitted To"');
});

test('smoke: lab cover contains "Experiment Date"; assignment cover does NOT', () => {
  const labPath = path.join(ROOT_DIR, 'client', 'cover-lab.html');
  const assignmentPath = path.join(ROOT_DIR, 'client', 'cover-assignment.html');

  const labHtml = fs.readFileSync(labPath, 'utf-8');
  const assignmentHtml = fs.readFileSync(assignmentPath, 'utf-8');

  assert.match(labHtml, /Experiment Date/i, 'Lab cover must contain "Experiment Date"');
  assert.doesNotMatch(assignmentHtml, /Experiment Date/i, 'Assignment cover must NOT contain "Experiment Date"');
});

test('smoke: neither cover references ../reference/ or any *.pdf path', () => {
  const labPath = path.join(ROOT_DIR, 'client', 'cover-lab.html');
  const assignmentPath = path.join(ROOT_DIR, 'client', 'cover-assignment.html');

  const labHtml = fs.readFileSync(labPath, 'utf-8');
  const assignmentHtml = fs.readFileSync(assignmentPath, 'utf-8');

  assert.doesNotMatch(labHtml, /\.\.\/reference\//i, 'Lab cover must not reference ../reference/');
  assert.doesNotMatch(assignmentHtml, /\.\.\/reference\//i, 'Assignment cover must not reference ../reference/');
  assert.doesNotMatch(labHtml, /\.pdf\b/i, 'Lab cover must not reference any .pdf file');
  assert.doesNotMatch(assignmentHtml, /\.pdf\b/i, 'Assignment cover must not reference any .pdf file');
});

/* Phase 3: Interactive Form, Live Preview & Data Assertions */

test('smoke: client/create.html exists and links to css/cover.css', () => {
  const createPath = path.join(ROOT_DIR, 'client', 'create.html');
  assert.equal(fs.existsSync(createPath), true, 'client/create.html must exist');

  const createHtml = fs.readFileSync(createPath, 'utf-8');
  assert.match(
    createHtml,
    /<link[^>]+href=["'][^"']*css\/cover\.css["']/i,
    'client/create.html must link css/cover.css'
  );
});

test('smoke: client/data/dropdowns.json exists and is valid JSON with non-empty arrays', () => {
  const jsonPath = path.join(ROOT_DIR, 'client', 'data', 'dropdowns.json');
  assert.equal(fs.existsSync(jsonPath), true, 'client/data/dropdowns.json must exist');

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);

  assert.equal(Array.isArray(data.universities), true, 'universities must be an array');
  assert.equal(data.universities.length > 0, true, 'universities array must not be empty');

  assert.equal(Array.isArray(data.departments), true, 'departments must be an array');
  assert.equal(data.departments.length > 0, true, 'departments array must not be empty');

  assert.equal(Array.isArray(data.courses), true, 'courses must be an array');
  assert.equal(data.courses.length > 0, true, 'courses array must not be empty');
});

test('smoke: every course in dropdowns.json has all five keys (shape assertion)', () => {
  const jsonPath = path.join(ROOT_DIR, 'client', 'data', 'dropdowns.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  data.courses.forEach((course, idx) => {
    const keys = Object.keys(course).sort();
    assert.deepEqual(
      keys,
      ['code', 'dept', 'level', 'term', 'title'],
      `Course at index ${idx} must have keys: code, dept, level, term, title`
    );
    assert.equal(typeof course.dept, 'string', `course[${idx}].dept must be string`);
    assert.equal(typeof course.level, 'number', `course[${idx}].level must be number`);
    assert.equal(typeof course.term, 'string', `course[${idx}].term must be string`);
    assert.equal(typeof course.code, 'string', `course[${idx}].code must be string`);
    assert.equal(typeof course.title, 'string', `course[${idx}].title must be string`);
  });
});

test('smoke: every course.dept appears in departments[].code (no orphan departments)', () => {
  const jsonPath = path.join(ROOT_DIR, 'client', 'data', 'dropdowns.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const validDeptCodes = new Set(data.departments.map((d) => d.code));
  data.courses.forEach((course) => {
    assert.equal(
      validDeptCodes.has(course.dept),
      true,
      `Course dept "${course.dept}" (${course.code}) must exist in departments list`
    );
  });
});

test('smoke: client/js/create.js and client/js/storage.js exist', () => {
  const createJsPath = path.join(ROOT_DIR, 'client', 'js', 'create.js');
  const storageJsPath = path.join(ROOT_DIR, 'client', 'js', 'storage.js');

  assert.equal(fs.existsSync(createJsPath), true, 'client/js/create.js must exist');
  assert.equal(fs.existsSync(storageJsPath), true, 'client/js/storage.js must exist');
});

/* Phase 4: Multi-Teacher Management Smoke Assertions */

test('smoke: client/create.html contains #add-teacher and data-field="teachers-list"', () => {
  const createHtmlPath = path.join(ROOT_DIR, 'client', 'create.html');
  const html = fs.readFileSync(createHtmlPath, 'utf-8');

  assert.match(html, /id=["']add-teacher["']/, 'create.html must contain id="add-teacher"');
  assert.match(html, /data-field=["']teachers-list["']/, 'create.html must contain data-field="teachers-list"');
});

test('smoke: client/create.html does NOT contain teacher-name or teacher-designation data-fields', () => {
  const createHtmlPath = path.join(ROOT_DIR, 'client', 'create.html');
  const html = fs.readFileSync(createHtmlPath, 'utf-8');

  assert.doesNotMatch(
    html,
    /data-field=["']teacher-name["']/,
    'create.html must not contain data-field="teacher-name"'
  );
  assert.doesNotMatch(
    html,
    /data-field=["']teacher-designation["']/,
    'create.html must not contain data-field="teacher-designation"'
  );
});

test('smoke: client/js/create.js references teacher datalists', () => {
  const createJsPath = path.join(ROOT_DIR, 'client', 'js', 'create.js');
  const js = fs.readFileSync(createJsPath, 'utf-8');

  assert.equal(js.includes('teacher-roles-list'), true, 'create.js must reference teacher-roles-list');
  assert.equal(js.includes('teacher-designations-list'), true, 'create.js must reference teacher-designations-list');
});

/* Phase 4.5: Design System, Landing Page & Quality Gate Assertions */

test('smoke: client/create.html links to css/site.css', () => {
  const createHtmlPath = path.join(ROOT_DIR, 'client', 'create.html');
  const html = fs.readFileSync(createHtmlPath, 'utf-8');
  assert.match(html, /<link[^>]+href=["'][^"']*css\/site\.css["']/i, 'create.html must link css/site.css');
});

test('smoke: client/css/site.css, landing.css, and client/js/site.js exist', () => {
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'client', 'css', 'site.css')), true, 'site.css must exist');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'client', 'css', 'landing.css')), true, 'landing.css must exist');
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'client', 'js', 'site.js')), true, 'site.js must exist');
});

test('smoke: forbidden-pattern scan across CSS and HTML (no gradients, blur, backdrop-filter, or colored glows)', () => {
  const filesToScan = [
    path.join(ROOT_DIR, 'client', 'css', 'site.css'),
    path.join(ROOT_DIR, 'client', 'css', 'landing.css'),
    path.join(ROOT_DIR, 'client', 'css', 'form.css'),
    path.join(ROOT_DIR, 'client', 'index.html')
  ];

  for (const filePath of filesToScan) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rel = path.relative(ROOT_DIR, filePath);

    assert.doesNotMatch(content, /(?:linear|radial|conic)-gradient/i, `${rel} must not contain CSS gradients`);
    assert.doesNotMatch(content, /backdrop-filter/i, `${rel} must not contain backdrop-filter`);
    assert.doesNotMatch(content, /filter:\s*blur/i, `${rel} must not contain blur filter`);

    // Box shadow color check: must only use rgba(15, 23, 42, ... or rgba(0, 0, 0, ...
    const shadowMatches = content.match(/box-shadow:[^;]+;/gi) || [];
    for (const s of shadowMatches) {
      const rgbaMatches = s.match(/rgba\([^)]+\)/gi) || [];
      for (const r of rgbaMatches) {
        assert.match(
          r,
          /^rgba\(\s*(?:15,\s*23,\s*42|0,\s*0,\s*0)\s*,/i,
          `Invalid box-shadow color "${r}" in ${rel}. Only rgba(15, 23, 42, ...) or rgba(0, 0, 0, ...) allowed.`
        );
      }
    }

    // Explicit check forbidding Bucket A colored shadow / glow hex values
    const forbiddenHexes = ['#145bea20', '#23365a25', '#15264a08', '#1e2a421a', '#145bea15'];
    for (const hex of forbiddenHexes) {
      assert.equal(
        content.toLowerCase().includes(hex.toLowerCase()),
        false,
        `${rel} must not contain forbidden colored shadow/glow hex "${hex}"`
      );
    }
  }
});

test('smoke: emoji and unicode decoration scan', () => {
  const filesToScan = [
    path.join(ROOT_DIR, 'client', 'index.html'),
    path.join(ROOT_DIR, 'client', 'create.html'),
    path.join(ROOT_DIR, 'client', 'css', 'site.css'),
    path.join(ROOT_DIR, 'client', 'css', 'landing.css'),
    path.join(ROOT_DIR, 'client', 'css', 'form.css'),
    path.join(ROOT_DIR, 'client', 'js', 'site.js')
  ];

  const forbiddenEmojis = ['🚀', '✅', '✨', '🎯', '🔒', '📄', '⚡', '💡', '📚'];

  for (const filePath of filesToScan) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rel = path.relative(ROOT_DIR, filePath);

    for (const em of forbiddenEmojis) {
      assert.equal(content.includes(em), false, `${rel} must not contain forbidden emoji ${em}`);
    }

    for (let i = 0; i < content.length; i++) {
      const cp = content.codePointAt(i);
      if (cp > 0xffff) i++;

      // Emoji pictographs: 0x1F300 - 0x1FAFF
      if (cp >= 0x1f300 && cp <= 0x1faff) {
        throw new Error(`Forbidden emoji pictograph U+${cp.toString(16).toUpperCase()} found in ${rel}`);
      }

      // Misc symbols: 0x2600 - 0x27BF
      if (cp >= 0x2600 && cp <= 0x27bf) {
        throw new Error(`Forbidden symbol U+${cp.toString(16).toUpperCase()} found in ${rel}`);
      }

      // Arrows: 0x2190 - 0x21FF
      if (cp >= 0x2190 && cp <= 0x21ff) {
        const char = String.fromCodePoint(cp);
        if (char === '→') {
          const surrounding = content.slice(Math.max(0, i - 25), i + 5);
          assert.match(
            surrounding,
            /Create a cover page\s*→/,
            `Arrow "→" in ${rel} is only allowed in "Create a cover page →"`
          );
        } else if (char === '←') {
          const surrounding = content.slice(Math.max(0, i - 5), i + 20);
          assert.match(
            surrounding,
            /←\s*Back to home/i,
            `Arrow "←" in ${rel} is only allowed in "← Back to home"`
          );
        } else {
          throw new Error(`Forbidden arrow symbol U+${cp.toString(16).toUpperCase()} found in ${rel}`);
        }
      }
    }
  }
});

/* Phase 04.6: Quick Cover Rebrand & Tool-Page Pattern Match Assertions */

test('smoke: client/index.html and client/create.html contain "Quick Cover"', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'client', 'index.html'), 'utf-8');
  const createHtml = fs.readFileSync(path.join(ROOT_DIR, 'client', 'create.html'), 'utf-8');

  assert.equal(indexHtml.includes('Quick Cover'), true, 'client/index.html must contain "Quick Cover"');
  assert.equal(createHtml.includes('Quick Cover'), true, 'client/create.html must contain "Quick Cover"');
});

test('smoke: no user-facing "Cover Page Generator" or "CoverCraft" remains in client/*.html', () => {
  const htmlFiles = fs.readdirSync(path.join(ROOT_DIR, 'client'))
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(ROOT_DIR, 'client', f));

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const rel = path.relative(ROOT_DIR, file);
    assert.doesNotMatch(content, /Cover Page Generator/i, `${rel} must not contain user-facing "Cover Page Generator"`);
    assert.doesNotMatch(content, /CoverCraft/i, `${rel} must not contain user-facing "CoverCraft"`);
  }
});

test('smoke: docs/UI_REFERENCE_ANALYSIS.md and reference/quick_cover_ui_reference.html exist', () => {
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'docs', 'UI_REFERENCE_ANALYSIS.md')), true);
  assert.equal(fs.existsSync(path.join(ROOT_DIR, 'reference', 'quick_cover_ui_reference.html')), true);
});

test('smoke: cover.css SHA-256 hash equals pre-phase hash', () => {
  const coverCss = fs.readFileSync(path.join(ROOT_DIR, 'client', 'css', 'cover.css'));
  const hash = crypto.createHash('sha256').update(coverCss).digest('hex').toUpperCase();

  const PRE_PHASE_HASH = '055132E855624DF5B83BD91D2E819BBAFAE34CEC0BF5E03064F6AA0D689320EE';
  assert.equal(hash, PRE_PHASE_HASH, 'client/css/cover.css must be byte-identical to pre-phase hash');
});

test('smoke: cover-lab.html and cover-assignment.html diffs are limited strictly to <title>', () => {
  const labHtml = fs.readFileSync(path.join(ROOT_DIR, 'client', 'cover-lab.html'), 'utf-8');
  const assignmentHtml = fs.readFileSync(path.join(ROOT_DIR, 'client', 'cover-assignment.html'), 'utf-8');

  // Verify titles have been updated
  assert.match(labHtml, /<title>Quick Cover — Static Lab Report Cover<\/title>/);
  assert.match(assignmentHtml, /<title>Quick Cover — Static Assignment Cover<\/title>/);

  // If title is swapped back to original, content should match Phase 2 templates exactly
  const labReverted = labHtml.replace('<title>Quick Cover — Static Lab Report Cover</title>', '<title>Cover Page Generator — Static Lab Report Cover</title>');
  const assignmentReverted = assignmentHtml.replace('<title>Quick Cover — Static Assignment Cover</title>', '<title>Cover Page Generator — Static Assignment Cover</title>');

  const labHash = crypto.createHash('sha256').update(labReverted).digest('hex').toUpperCase();
  const assignmentHash = crypto.createHash('sha256').update(assignmentReverted).digest('hex').toUpperCase();

  const PRE_PHASE_LAB_HASH = '132EB621D833561EF251C23B49F1A6D5154880295D52B2CD6C8D59AC35103630';
  const PRE_PHASE_ASSIGN_HASH = '93FD29FB85F8C281047BE252736646E6AEEC2304FE4A17BB76D043FD58DA93C3';

  assert.equal(labHash, PRE_PHASE_LAB_HASH, 'cover-lab.html diff must be limited strictly to <title>');
  assert.equal(assignmentHash, PRE_PHASE_ASSIGN_HASH, 'cover-assignment.html diff must be limited strictly to <title>');
});

/* Phase 04 Typography Bump & Alignment Assertions */

test('smoke: site.css typography bump scale assertions', () => {
  const siteCss = fs.readFileSync(path.join(ROOT_DIR, 'client', 'css', 'site.css'), 'utf-8');

  // body font size >= 17px
  const bodyMatch = siteCss.match(/html,\s*body\s*\{[^}]*font-size:\s*(\d+)px/i);
  assert.equal(Boolean(bodyMatch), true, 'site.css must declare font-size on html, body');
  assert.equal(parseInt(bodyMatch[1], 10) >= 17, true, 'body font-size must be >= 17px');

  // .input, .select, .textarea font size >= 16px
  const inputMatch = siteCss.match(/\.input,\s*\.select,\s*\.textarea\s*\{[^}]*font:\s*(\d+)px/i);
  assert.equal(Boolean(inputMatch), true, 'site.css must declare font size on .input, .select, .textarea');
  assert.equal(parseInt(inputMatch[1], 10) >= 16, true, '.input font-size must be >= 16px');

  // .form-field label font size >= 15px
  const labelMatch = siteCss.match(/\.form-field\s+label\s*\{[^}]*font-size:\s*(\d+)px/i);
  assert.equal(Boolean(labelMatch), true, 'site.css must declare font-size on .form-field label');
  assert.equal(parseInt(labelMatch[1], 10) >= 15, true, '.form-field label font-size must be >= 15px');

  // .btn font size >= 15px
  const btnMatch = siteCss.match(/\.btn\s*\{[^}]*font-size:\s*(\d+)px/i);
  assert.equal(Boolean(btnMatch), true, 'site.css must declare font-size on .btn');
  assert.equal(parseInt(btnMatch[1], 10) >= 15, true, '.btn font-size must be >= 15px');
});

test('smoke: landing page content preservation (verbatim strings)', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'client', 'index.html'), 'utf-8');

  // Hero headline
  assert.equal(
    indexHtml.includes("A cover page that matches your department's format. On the first try."),
    true,
    'index.html must preserve hero headline verbatim'
  );

  // All 6 feature titles
  const featureTitles = [
    'Two layouts, matched to the reference.',
    'Course catalogue built in.',
    'Multiple teachers.',
    'A4 print-ready.',
    'Your data stays on this device.',
    'Pick up where you left off.'
  ];
  for (const title of featureTitles) {
    assert.equal(indexHtml.includes(title), true, `index.html must preserve feature title "${title}"`);
  }

  // All 3 step titles
  const stepTitles = [
    'Choose the document type.',
    'Fill in the form.',
    'Print or save as PDF.'
  ];
  for (const step of stepTitles) {
    assert.equal(indexHtml.includes(step), true, `index.html must preserve step title "${step}"`);
  }

  // Closing CTA headline
  assert.equal(
    indexHtml.includes('Ready when you are.'),
    true,
    'index.html must preserve closing CTA headline'
  );

  // Footer fineprint
  assert.equal(
    indexHtml.includes('All processing happens in your browser. No account required. Drafts and logos are stored locally on this device.'),
    true,
    'index.html must preserve footer fineprint verbatim'
  );
});

test('smoke: tool page form control IDs preservation', () => {
  const createHtml = fs.readFileSync(path.join(ROOT_DIR, 'client', 'create.html'), 'utf-8');

  const requiredIds = [
    'university', 'department', 'level', 'term', 'course-code', 'course-title',
    'doc-number', 'doc-title', 'comment', 'student-name', 'student-id',
    'experiment-date', 'submission-date', 'doc-type-lab', 'doc-type-assignment',
    'logo-upload', 'add-teacher', 'teachers-form-container', 'teachers-fieldset'
  ];

  for (const id of requiredIds) {
    const regex = new RegExp(`id=["']${id}["']`);
    assert.match(createHtml, regex, `create.html must preserve form control id="${id}"`);
  }
});

test('smoke: assert absence of prototype unicode-as-icon characters in HTML', () => {
  const files = [
    path.join(ROOT_DIR, 'client', 'index.html'),
    path.join(ROOT_DIR, 'client', 'create.html')
  ];

  // Forbid U+21AF (↯), U+25A4 (▤), U+2193 (↓), U+270E (✎), U+21BB (↻), U+25A7 (▧)
  const forbiddenGlyphs = ['\u21AF', '\u25A4', '\u2193', '\u270E', '\u21BB', '\u25A7'];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const rel = path.relative(ROOT_DIR, file);

    for (const glyph of forbiddenGlyphs) {
      assert.equal(
        content.includes(glyph),
        false,
        `${rel} must not contain prototype unicode glyph U+${glyph.codePointAt(0).toString(16).toUpperCase()}`
      );
    }
  }
});

/* Phase 05: Persistence Polish, Storage Status, Error Handling & Cross-Tab Safety */

test('smoke: create.html contains id="clear-form" and id="storage-status" with role="status"', () => {
  const createHtml = fs.readFileSync(path.join(ROOT_DIR, 'client', 'create.html'), 'utf-8');
  assert.match(createHtml, /id=["']clear-form["']/, 'create.html must contain id="clear-form"');
  assert.match(createHtml, /id=["']storage-status["']/, 'create.html must contain id="storage-status"');
  assert.match(createHtml, /id=["']storage-status["'][^>]*role=["']status["']/, 'storage-status element must have role="status"');
});

test('smoke: create.js registers window storage event listener', () => {
  const createJs = fs.readFileSync(path.join(ROOT_DIR, 'client', 'js', 'create.js'), 'utf-8');
  const hasStorageListener = createJs.includes('addEventListener("storage"') || createJs.includes("addEventListener('storage'");
  assert.equal(hasStorageListener, true, 'create.js must register a storage event listener for cross-tab synchronization');
});

test('smoke: create.js contains cross-tab ping-pong guard (isApplyingRemoteChange)', () => {
  const createJs = fs.readFileSync(path.join(ROOT_DIR, 'client', 'js', 'create.js'), 'utf-8');
  assert.equal(createJs.includes('isApplyingRemoteChange'), true, 'create.js must contain isApplyingRemoteChange guard');
});

test('smoke: storage.js wraps localStorage access with try/catch and handles QuotaExceededError', () => {
  const storageJs = fs.readFileSync(path.join(ROOT_DIR, 'client', 'js', 'storage.js'), 'utf-8');
  assert.match(storageJs, /QuotaExceededError/, 'storage.js must explicitly handle QuotaExceededError');
  assert.match(storageJs, /try\s*\{[^}]*localStorage/s, 'storage.js must wrap localStorage access in try/catch');
});
