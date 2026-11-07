import fs from 'node:fs';
import crypto from 'node:crypto';

console.log('=== PRELIMINARY INSPECTION FOR PHASE 06 ===');

// C.1 Inventory
const dirs = ['client', 'client/css', 'client/js', 'client/data', 'docs', 'tests', 'scripts', 'reference'];
console.log('C.1 Directory Inventory:');
for (const d of dirs) {
  const exists = fs.existsSync(d);
  const count = exists ? fs.readdirSync(d).length : 0;
  console.log(`  - ${d}: ${exists ? count + ' items' : 'MISSING'}`);
}

// C.2.a cover.css SHA-256
const coverCss = fs.readFileSync('client/css/cover.css');
const hash = crypto.createHash('sha256').update(coverCss).digest('hex').toUpperCase();
const targetHash = '055132E855624DF5B83BD91D2E819BBAFAE34CEC0BF5E03064F6AA0D689320EE';
console.log('\nC.2.a cover.css SHA-256:', hash);
console.log('  Matches expected:', hash === targetHash);

// C.2.b create.html checks
const createHtml = fs.readFileSync('client/create.html', 'utf8');
const c2bChecks = {
  hasClearForm: createHtml.includes('id="clear-form"'),
  hasStorageStatusRoleStatus: /id=["']storage-status["'][^>]*role=["']status["']/.test(createHtml),
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
  hasStorageListener: createJs.includes('addEventListener("storage"') || createJs.includes("addEventListener('storage'"),
  hasApplyingRemoteChange: createJs.includes('isApplyingRemoteChange'),
  hasDraftVersion2: createJs.includes('draftVersion: 2')
};
console.log('\nC.2.c create.js checks:', c2cChecks);

// C.2.d storage.js checks
const storageJs = fs.readFileSync('client/js/storage.js', 'utf8');
const c2dChecks = {
  hasQuotaExceeded: storageJs.includes('QuotaExceededError') || storageJs.includes('code === 22'),
  hasTryCatchLocalStorage: /try\s*\{[^}]*localStorage/s.test(storageJs)
};
console.log('\nC.2.d storage.js checks:', c2dChecks);

// C.2.e brand name checks
const indexHtml = fs.readFileSync('client/index.html', 'utf8');
const c2eChecks = {
  indexHasQuickCover: indexHtml.includes('Quick Cover'),
  createHasQuickCover: createHtml.includes('Quick Cover'),
  indexNoOldBrands: !indexHtml.includes('Cover Page Generator') && !indexHtml.includes('CoverCraft'),
  createNoOldBrands: !createHtml.includes('Cover Page Generator') && !createHtml.includes('CoverCraft')
};
console.log('\nC.2.e brand name checks:', c2eChecks);

// C.2.f forbidden hex values
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
console.log('\nC.2.f forbidden hex findings:', Object.keys(hexFindings).length === 0 ? 'ALL CLEAN' : hexFindings);
