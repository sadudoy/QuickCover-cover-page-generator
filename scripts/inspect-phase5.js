import fs from 'node:fs';
import crypto from 'node:crypto';

console.log('=== PRELIMINARY INSPECTION C.1 & C.2 ===');

// C.1 Inventory
const dirs = ['client', 'client/css', 'client/js', 'client/data', 'docs', 'tests', 'scripts', 'reference'];
const inventory = {};
for (const d of dirs) {
  inventory[d] = fs.existsSync(d) ? fs.readdirSync(d) : 'MISSING';
}
console.log('Inventory check:');
for (const [k, v] of Object.entries(inventory)) {
  console.log(`  - ${k}: ${Array.isArray(v) ? v.length + ' files' : 'MISSING'}`);
}

// C.2.a Hash of cover.css
const coverCss = fs.readFileSync('client/css/cover.css');
const hash = crypto.createHash('sha256').update(coverCss).digest('hex').toUpperCase();
const targetHash = '055132E855624DF5B83BD91D2E819BBAFAE34CEC0BF5E03064F6AA0D689320EE';
console.log('\nC.2.a cover.css SHA-256:', hash);
console.log('  Hash matches expected:', hash === targetHash);

// C.2.b create.html checks
const createHtml = fs.readFileSync('client/create.html', 'utf8');
const c2bChecks = {
  hasAddTeacher: createHtml.includes('id="add-teacher"'),
  hasTeachersContainer: createHtml.includes('id="teachers-form-container"'),
  hasTeachersListField: createHtml.includes('data-field="teachers-list"'),
  hasRolesDatalist: createHtml.includes('id="teacher-roles-list"'),
  hasDesigDatalist: createHtml.includes('id="teacher-designations-list"'),
  noOldTeacherNameField: !createHtml.includes('data-field="teacher-name"'),
  noOldTeacherDesigField: !createHtml.includes('data-field="teacher-designation"')
};
console.log('\nC.2.b create.html checks:', c2bChecks);

// C.2.c create.js checks
const createJs = fs.readFileSync('client/js/create.js', 'utf8');
const c2cChecks = {
  hasTeachersState: createJs.includes('let teachers = [{ role: \'\', name: \'\', designation: \'\' }]') || createJs.includes('let teachers = ['),
  hasRenderTeacherForm: createJs.includes('function renderTeacherForm'),
  hasRenderTeacherPreview: createJs.includes('function renderTeacherPreview'),
  hasLegacyMigration: createJs.includes('draft.teacherName') || createJs.includes('draft[\'teacher-name\']')
};
console.log('\nC.2.c create.js checks:', c2cChecks);

// C.2.d site.css font-size checks
const siteCss = fs.readFileSync('client/css/site.css', 'utf8');
const c2dChecks = {
  bodyFontSizeGte17: siteCss.includes('--qc-font-size-body: 17px') || siteCss.includes('font-size: 17px'),
  inputGte16: siteCss.includes('--qc-font-size-input: 16px'),
  formLabelGte15: siteCss.includes('--qc-font-size-label: 15px'),
  btnGte15: siteCss.includes('--qc-font-size-btn: 15px')
};
console.log('\nC.2.d site.css typography bump checks:', c2dChecks);

// C.2.e brand name checks
const indexHtml = fs.readFileSync('client/index.html', 'utf8');
const c2eChecks = {
  indexHasQuickCover: indexHtml.includes('Quick Cover'),
  createHasQuickCover: createHtml.includes('Quick Cover'),
  indexNoOldBrands: !indexHtml.includes('Cover Page Generator') && !indexHtml.includes('CoverCraft'),
  createNoOldBrands: !createHtml.includes('Cover Page Generator') && !createHtml.includes('CoverCraft')
};
console.log('\nC.2.e brand name checks:', c2eChecks);

// C.2.f index.html (landing) hero art & no linear-gradient
const landingCss = fs.readFileSync('client/css/landing.css', 'utf8');
const c2fChecks = {
  hasBlob: indexHtml.includes('class="blob"'),
  hasCardFront: indexHtml.includes('class="card-front"'),
  hasCardBack: indexHtml.includes('class="card-back"'),
  noLinearGradientInLandingCss: !landingCss.includes('linear-gradient')
};
console.log('\nC.2.f hero art and no linear-gradient:', c2fChecks);

// C.2.g forbidden colored shadows
const cssFiles = ['client/css/site.css', 'client/css/landing.css', 'client/css/form.css', 'client/css/cover.css'];
const forbiddenHexes = ['#145bea20', '#23365a25', '#15264a08', '#1e2a421a', '#145bea15'];
const hexFindings = {};
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const hex of forbiddenHexes) {
    if (content.toLowerCase().includes(hex.toLowerCase())) {
      hexFindings[`${file} contains ${hex}`] = true;
    }
  }
}
console.log('\nC.2.g forbidden hex findings:', Object.keys(hexFindings).length === 0 ? 'ALL CLEAN' : hexFindings);
