/**
 * CoverCraft — Interactive Form & Live Preview Controller
 * Handles datalist cascading, auto-fill, live A4 preview binding,
 * multi-teacher dynamic management, logo upload validation/persistence,
 * and debounced draft persistence with seamless backward migration.
 */

import {
  saveLogo,
  loadLogo,
  deleteLogo,
  saveDraft,
  loadDraft,
  clearDraft,
  isFallback,
  isStorageAvailable
} from './storage.js';

const DEFAULT_LOGO_SVG = `<svg viewBox="0 0 139 136" width="36.78mm" height="35.97mm" xmlns="http://www.w3.org/2000/svg"><rect width="139" height="136" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2" rx="4"/><text x="50%" y="45%" text-anchor="middle" dominant-baseline="middle" font-family="'Times New Roman', Times, serif" font-size="16" font-weight="bold" fill="#4b5563">LOGO</text><text x="50%" y="65%" text-anchor="middle" dominant-baseline="middle" font-family="'Times New Roman', Times, serif" font-size="11" fill="#6b7280">36.8 × 36 mm</text></svg>`;

let dropdownData = {
  universities: [],
  departments: [],
  courses: []
};

let currentFilteredCourses = [];
let saveTimeout = null;
let isApplyingRemoteChange = false;
let lastStatusMessage = '';
let lastStatusTime = 0;

// Multi-Teacher State (Phase 4)
let teachers = [{ role: '', name: '', designation: '' }];

// Form DOM Elements
const docTypeRadios = document.querySelectorAll('input[name="doc-type"]');
const clearFormBtn = document.getElementById('clear-form');
const universityInput = document.getElementById('university');
const departmentInput = document.getElementById('department');
const levelSelect = document.getElementById('level');
const termSelect = document.getElementById('term');
const courseCodeInput = document.getElementById('course-code');
const courseTitleInput = document.getElementById('course-title');
const docNumberInput = document.getElementById('doc-number');
const docTitleInput = document.getElementById('doc-title');
const commentInput = document.getElementById('comment');
const studentNameInput = document.getElementById('student-name');
const studentIdInput = document.getElementById('student-id');
const experimentDateInput = document.getElementById('experiment-date');
const submissionDateInput = document.getElementById('submission-date');

// Multi-Teacher Form Elements
const teachersFormContainer = document.getElementById('teachers-form-container');
const addTeacherBtn = document.getElementById('add-teacher');

// Logo and Storage Status Elements
const logoUploadInput = document.getElementById('logo-upload');
const removeLogoBtn = document.getElementById('remove-logo');
const logoErrorEl = document.getElementById('logo-error');
const storageStatusEl = document.getElementById('storage-status');

// Form Layout Helper Elements
const experimentDateGroup = document.getElementById('experiment-date-group');
const docNumberLabel = document.getElementById('doc-number-label');
const docTitleLabel = document.getElementById('doc-title-label');

// Datalist Elements
const universitiesDatalist = document.getElementById('universities-list');
const departmentsDatalist = document.getElementById('departments-list');
const courseCodesDatalist = document.getElementById('course-codes-list');
const courseTitlesDatalist = document.getElementById('course-titles-list');

// Preview DOM Elements
const coverPreviewWrapper = document.getElementById('cover-preview');
const a4CoverEl = coverPreviewWrapper ? coverPreviewWrapper.querySelector('.a4-cover') : null;
const previewViewport = document.getElementById('preview-viewport');
const previewDocNumberLabel = document.getElementById('preview-doc-number-label');
const previewDocTitleLabel = document.getElementById('preview-doc-title-label');
const logoBoxEl = coverPreviewWrapper ? coverPreviewWrapper.querySelector('.logo-box') : null;

// Preview Card & Teacher Elements
const teachersPreviewContainer = coverPreviewWrapper
  ? coverPreviewWrapper.querySelector('[data-field="teachers-list"]')
  : null;
const cardSubmittedTo = coverPreviewWrapper
  ? coverPreviewWrapper.querySelector('.card-submitted-to')
  : null;
const cardSubmittedBy = coverPreviewWrapper
  ? coverPreviewWrapper.querySelector('.card-submitted-by')
  : null;
const signatureLineEl = coverPreviewWrapper
  ? coverPreviewWrapper.querySelector('.sub-to-row-sign')
  : null;

/**
 * Format YYYY-MM-DD input date to DD/MM/YYYY for cover preview
 */
function formatDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [yyyy, mm, dd] = parts;
  if (!yyyy || !mm || !dd) return isoDate;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Update textContent of a single preview data-field element safely
 */
function updatePreviewField(fieldName, text) {
  if (!coverPreviewWrapper) return;
  const elements = coverPreviewWrapper.querySelectorAll(
    `[data-field="${fieldName}"], [data-field-alt="${fieldName}"]`
  );
  elements.forEach((el) => {
    el.textContent = text || '';
  });
}

/**
 * Live sync all static form fields to preview
 */
function syncAllToPreview() {
  updatePreviewField('university-name', universityInput.value);
  updatePreviewField('department-name', departmentInput.value);
  updatePreviewField('level', levelSelect.value);
  updatePreviewField('term', termSelect.value);
  updatePreviewField('course-code', courseCodeInput.value);
  updatePreviewField('course-title', courseTitleInput.value);
  updatePreviewField('doc-number', docNumberInput.value);
  updatePreviewField('report-no', docNumberInput.value);
  updatePreviewField('doc-title', docTitleInput.value);
  updatePreviewField('report-title', docTitleInput.value);
  updatePreviewField('comment-box', commentInput.value);
  updatePreviewField('student-name', studentNameInput.value);
  updatePreviewField('student-id', studentIdInput.value);

  const isLab = getSelectedDocType() === 'lab-report';
  updatePreviewField('experiment-date', isLab ? formatDate(experimentDateInput.value) : '');
  updatePreviewField('submission-date', formatDate(submissionDateInput.value));

  renderTeacherPreview();
}

/**
 * Get current selected document type ('lab-report' | 'assignment')
 */
function getSelectedDocType() {
  const selected = document.querySelector('input[name="doc-type"]:checked');
  return selected ? selected.value : 'lab-report';
}

/**
 * Handle document type switching (data-cover-type, labels, experiment-date)
 */
function handleDocTypeChange(shouldSave = false) {
  const docType = getSelectedDocType();
  if (a4CoverEl) {
    a4CoverEl.setAttribute('data-cover-type', docType);
  }

  if (docType === 'lab-report') {
    docNumberLabel.textContent = 'Report no.:';
    docTitleLabel.textContent = 'Report Title:';
    if (previewDocNumberLabel) previewDocNumberLabel.textContent = 'Report no.';
    if (previewDocTitleLabel) previewDocTitleLabel.textContent = 'Report Title';
    experimentDateGroup.classList.remove('is-hidden');
    updatePreviewField('cover-title', 'LAB REPORT');
    updatePreviewField('experiment-date', formatDate(experimentDateInput.value));
  } else {
    docNumberLabel.textContent = 'Assignment no.:';
    docTitleLabel.textContent = 'Assignment Title:';
    if (previewDocNumberLabel) previewDocNumberLabel.textContent = 'Assignment no.';
    if (previewDocTitleLabel) previewDocTitleLabel.textContent = 'Assignment Title';
    experimentDateGroup.classList.add('is-hidden');
    experimentDateInput.value = '';
    updatePreviewField('cover-title', 'Assignment');
    updatePreviewField('experiment-date', '');
  }

  renderTeacherPreview();
  if (shouldSave) {
    queueDraftSave();
  }
}

/**
 * Progressive filtering cascade: Department + Level + Term -> Course Code / Title datalists
 */
function updateCourseLists() {
  const deptInputVal = departmentInput.value.trim().toLowerCase();
  let matchedDeptCode = null;

  if (deptInputVal) {
    const matchedDept = dropdownData.departments.find(
      (d) => d.name.trim().toLowerCase() === deptInputVal || d.code.trim().toLowerCase() === deptInputVal
    );
    if (matchedDept) {
      matchedDeptCode = matchedDept.code;
    }
  }

  const levelVal = levelSelect.value ? parseInt(levelSelect.value, 10) : null;
  const termVal = termSelect.value ? termSelect.value.trim() : null;

  let filtered = dropdownData.courses || [];

  if (matchedDeptCode) {
    filtered = filtered.filter((c) => c.dept === matchedDeptCode);
  } else if (deptInputVal) {
    filtered = [];
  }

  if (levelVal !== null && !isNaN(levelVal)) {
    filtered = filtered.filter((c) => c.level === levelVal);
  }

  if (termVal) {
    filtered = filtered.filter((c) => c.term === termVal);
  }

  currentFilteredCourses = filtered;

  const uniqueCodes = Array.from(new Set(filtered.map((c) => c.code))).sort();
  courseCodesDatalist.textContent = '';
  uniqueCodes.forEach((code) => {
    const opt = document.createElement('option');
    opt.value = code;
    courseCodesDatalist.appendChild(opt);
  });

  const uniqueTitles = Array.from(new Set(filtered.map((c) => c.title))).sort();
  courseTitlesDatalist.textContent = '';
  uniqueTitles.forEach((title) => {
    const opt = document.createElement('option');
    opt.value = title;
    courseTitlesDatalist.appendChild(opt);
  });
}

/**
 * Bidirectional auto-fill for Course Code <-> Course Title
 */
function handleCourseCodeInput() {
  const codeVal = courseCodeInput.value.trim().toLowerCase();
  if (!codeVal) return;

  const matched = currentFilteredCourses.find(
    (c) => c.code.trim().toLowerCase() === codeVal
  );
  if (matched) {
    courseTitleInput.value = matched.title;
    updatePreviewField('course-title', matched.title);
  }
}

function handleCourseTitleInput() {
  const titleVal = courseTitleInput.value.trim().toLowerCase();
  if (!titleVal) return;

  const matched = currentFilteredCourses.find(
    (c) => c.title.trim().toLowerCase() === titleVal
  );
  if (matched) {
    courseCodeInput.value = matched.code;
    updatePreviewField('course-code', matched.code);
  }
}

/**
 * Multi-Teacher Form Renderer (Phase 4)
 */
function renderTeacherForm() {
  if (!teachersFormContainer) return;
  teachersFormContainer.textContent = '';

  teachers.forEach((teacher, index) => {
    const row = document.createElement('div');
    row.className = 'teacher-row';
    row.dataset.index = String(index);

    // Role
    const roleLabel = document.createElement('label');
    roleLabel.textContent = 'Role';
    const roleInput = document.createElement('input');
    roleInput.setAttribute('list', 'teacher-roles-list');
    roleInput.className = 't-role';
    roleInput.dataset.index = String(index);
    roleInput.dataset.prop = 'role';
    roleInput.value = teacher.role || '';
    roleInput.autocomplete = 'off';
    roleInput.placeholder = 'e.g. Course Teacher';
    roleLabel.appendChild(roleInput);
    row.appendChild(roleLabel);

    // Name
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name';
    const nameInput = document.createElement('input');
    nameInput.className = 't-name';
    nameInput.dataset.index = String(index);
    nameInput.dataset.prop = 'name';
    nameInput.value = teacher.name || '';
    nameInput.placeholder = "Teacher's Name";
    nameLabel.appendChild(nameInput);
    row.appendChild(nameLabel);

    // Designation
    const desigLabel = document.createElement('label');
    desigLabel.textContent = 'Designation';
    const desigInput = document.createElement('input');
    desigInput.setAttribute('list', 'teacher-designations-list');
    desigInput.className = 't-designation';
    desigInput.dataset.index = String(index);
    desigInput.dataset.prop = 'designation';
    desigInput.value = teacher.designation || '';
    desigInput.autocomplete = 'off';
    desigInput.placeholder = 'e.g. Assistant Professor';
    desigLabel.appendChild(desigInput);
    row.appendChild(desigLabel);

    // Remove Button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 't-remove';
    removeBtn.dataset.index = String(index);
    removeBtn.setAttribute('aria-label', 'Remove teacher');
    removeBtn.textContent = '×';
    if (teachers.length === 1) {
      removeBtn.disabled = true;
    }
    row.appendChild(removeBtn);

    teachersFormContainer.appendChild(row);
  });
}

/**
 * Multi-Teacher Live Preview Renderer (Phase 4)
 * Uses textContent exclusively — no innerHTML for user values.
 */
function renderTeacherPreview() {
  if (!teachersPreviewContainer) return;
  teachersPreviewContainer.textContent = '';

  const activeTeachers = teachers.filter((t) => t.name.trim() !== '');

  activeTeachers.forEach((teacher) => {
    const entry = document.createElement('div');
    entry.className = 'teacher-entry';

    // Line 1: Role / Teacher Name + Name
    const line1 = document.createElement('div');
    line1.className = 'teacher-line teacher-line-name';

    const strong1 = document.createElement('strong');
    strong1.className = 'card-field-label';
    strong1.textContent = teacher.role.trim() ? `${teacher.role.trim()}:` : 'Teacher Name:';
    line1.appendChild(strong1);
    line1.appendChild(document.createTextNode(' '));

    const nameSpan = document.createElement('span');
    nameSpan.className = 'card-field-value';
    nameSpan.textContent = teacher.name;
    line1.appendChild(nameSpan);

    entry.appendChild(line1);

    // Line 2 (Optional): Designation
    if (teacher.designation.trim()) {
      const line2 = document.createElement('div');
      line2.className = 'teacher-line teacher-line-desig';

      const strong2 = document.createElement('strong');
      strong2.className = 'card-field-label';
      strong2.textContent = 'Designation:';
      line2.appendChild(strong2);
      line2.appendChild(document.createTextNode(' '));

      const desigSpan = document.createElement('span');
      desigSpan.className = 'card-field-value';
      desigSpan.textContent = teacher.designation;
      line2.appendChild(desigSpan);

      entry.appendChild(line2);
    }

    teachersPreviewContainer.appendChild(entry);
  });

  // Synchronize dynamic card heights and signature placement
  syncCardHeightsAndSignature();
}

/**
 * Card Heights and Shared Signature Line Synchronization (Phase 4)
 * In single-teacher default case, preserves Phase 2 geometry exactly.
 * In multi-teacher case, expands both cards downward in unison with pinned signature line.
 */
function syncCardHeightsAndSignature() {
  if (!cardSubmittedTo || !cardSubmittedBy || !teachersPreviewContainer) return;

  const isAssignment = getSelectedDocType() === 'assignment';
  const baseMinMm = isAssignment ? 58.64 : 66.13;
  const mmToPx = a4CoverEl ? (a4CoverEl.offsetWidth / 210) : 3.7795;
  const minHeightPx = baseMinMm * mmToPx;

  const teacherTopPx = (isAssignment ? 9.19 : 11.39) * mmToPx;
  const teacherHeightPx = teachersPreviewContainer.offsetHeight;
  const signatureHeightPx = signatureLineEl ? signatureLineEl.offsetHeight : 16;
  const bottomPaddingPx = 8 * mmToPx;

  const neededHeightPx = teacherTopPx + teacherHeightPx + signatureHeightPx + bottomPaddingPx;
  const activeCount = teachers.filter((t) => t.name.trim() !== '').length;

  if (neededHeightPx > minHeightPx && activeCount > 1) {
    const targetHeight = `${Math.ceil(neededHeightPx)}px`;
    cardSubmittedTo.style.height = targetHeight;
    cardSubmittedBy.style.height = targetHeight;
    if (signatureLineEl) {
      signatureLineEl.style.top = 'auto';
      signatureLineEl.style.bottom = `${3 * mmToPx}px`;
    }
  } else {
    // Revert to CSS defaults (exact Phase 2 min-height & signature coordinates)
    cardSubmittedTo.style.height = '';
    cardSubmittedBy.style.height = '';
    if (signatureLineEl) {
      signatureLineEl.style.top = '';
      signatureLineEl.style.bottom = '';
    }
  }
}

/**
 * Logo display rendering in preview logo box
 */
function renderLogoInPreview(blob) {
  if (!logoBoxEl) return;
  logoBoxEl.textContent = '';
  if (blob) {
    const img = document.createElement('img');
    img.className = 'uploaded-logo';
    img.alt = 'University Logo';
    img.src = URL.createObjectURL(blob);
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center';
    img.style.display = 'block';
    logoBoxEl.appendChild(img);
  } else {
    const parser = new DOMParser();
    const doc = parser.parseFromString(DEFAULT_LOGO_SVG, 'image/svg+xml');
    const svgEl = doc.documentElement;
    logoBoxEl.appendChild(document.importNode(svgEl, true));
  }
}

/**
 * Handle Logo File Upload
 */
async function handleLogoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  logoErrorEl.textContent = '';

  if (!file.type.startsWith('image/')) {
    logoErrorEl.textContent = 'Invalid file type. Please upload an image (PNG, JPG, SVG, WebP).';
    logoUploadInput.value = '';
    return;
  }

  const maxSizeBytes = 2 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    logoErrorEl.textContent = `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 2 MB.`;
    logoUploadInput.value = '';
    return;
  }

  try {
    const res = await saveLogo(file);
    renderLogoInPreview(file);
    if (res && res.success === false) {
      if (res.reason === 'quota') {
        setStorageStatus('Storage full — clear the form or remove the logo to save more.', 'warning');
      } else {
        setStorageStatus('Logo will not persist in this browser.', 'warning');
      }
    } else {
      setStorageStatus('Logo saved.', 'saved');
    }
  } catch (err) {
    console.error('Failed to save logo:', err);
    logoErrorEl.textContent = 'Failed to save logo to local storage.';
    setStorageStatus('Logo not saved: local storage error.', 'error');
  }
}

/**
 * Handle Logo Removal
 */
async function handleRemoveLogo() {
  try {
    await deleteLogo();
    logoUploadInput.value = '';
    logoErrorEl.textContent = '';
    renderLogoInPreview(null);
    setStorageStatus('Logo removed.', 'saved');
  } catch (err) {
    console.error('Failed to remove logo:', err);
    logoErrorEl.textContent = 'Failed to remove logo.';
  }
}

/**
 * Build snapshot of current in-memory draft state
 */
function getCurrentFormDraft() {
  return {
    docType: getSelectedDocType(),
    university: universityInput.value,
    department: departmentInput.value,
    level: levelSelect.value,
    term: termSelect.value,
    courseCode: courseCodeInput.value,
    courseTitle: courseTitleInput.value,
    docNumber: docNumberInput.value,
    docTitle: docTitleInput.value,
    comment: commentInput.value,
    studentName: studentNameInput.value,
    studentId: studentIdInput.value,
    experimentDate: experimentDateInput.value,
    submissionDate: submissionDateInput.value,
    teachers: teachers.map((t) => ({
      role: t.role || '',
      name: t.name || '',
      designation: t.designation || ''
    }))
  };
}

/**
 * Compare two draft objects for value equality
 */
function areDraftsEqual(a, b) {
  if (!a || !b) return false;
  const fields = [
    'docType', 'university', 'department', 'level', 'term',
    'courseCode', 'courseTitle', 'docNumber', 'docTitle',
    'comment', 'studentName', 'studentId', 'experimentDate', 'submissionDate'
  ];
  for (const f of fields) {
    if ((a[f] || '') !== (b[f] || '')) return false;
  }
  const tA = Array.isArray(a.teachers) ? a.teachers : [];
  const tB = Array.isArray(b.teachers) ? b.teachers : [];
  if (tA.length !== tB.length) return false;
  for (let i = 0; i < tA.length; i++) {
    if (
      (tA[i].role || '') !== (tB[i].role || '') ||
      (tA[i].name || '') !== (tB[i].name || '') ||
      (tA[i].designation || '') !== (tB[i].designation || '')
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Apply draft data payload to form inputs and teachers array
 */
function applyDraftToForm(draft) {
  if (!draft) return;

  if (draft.docType) {
    const targetRadio = document.querySelector(`input[name="doc-type"][value="${draft.docType}"]`);
    if (targetRadio) targetRadio.checked = true;
  }

  if (draft.university !== undefined) universityInput.value = draft.university;
  if (draft.department !== undefined) departmentInput.value = draft.department;
  if (draft.level !== undefined) levelSelect.value = draft.level;
  if (draft.term !== undefined) termSelect.value = draft.term;
  if (draft.courseCode !== undefined) courseCodeInput.value = draft.courseCode;
  if (draft.courseTitle !== undefined) courseTitleInput.value = draft.courseTitle;
  if (draft.docNumber !== undefined) docNumberInput.value = draft.docNumber;
  if (draft.docTitle !== undefined) docTitleInput.value = draft.docTitle;
  if (draft.comment !== undefined) commentInput.value = draft.comment;
  if (draft.studentName !== undefined) studentNameInput.value = draft.studentName;
  if (draft.studentId !== undefined) studentIdInput.value = draft.studentId;
  if (draft.experimentDate !== undefined) experimentDateInput.value = draft.experimentDate;
  if (draft.submissionDate !== undefined) submissionDateInput.value = draft.submissionDate;

  // Multi-Teacher Deserialization & Backward Migration
  if (Array.isArray(draft.teachers) && draft.teachers.length > 0) {
    teachers = draft.teachers.map((t) => ({
      role: t.role || '',
      name: t.name || '',
      designation: t.designation || ''
    }));
  } else if (
    draft.teacherName ||
    draft['teacher-name'] ||
    draft.teacherDesignation ||
    draft['teacher-designation']
  ) {
    teachers = [
      {
        role: '',
        name: draft.teacherName || draft['teacher-name'] || '',
        designation: draft.teacherDesignation || draft['teacher-designation'] || ''
      }
    ];
  } else {
    teachers = [{ role: '', name: '', designation: '' }];
  }
}

/**
 * Debounced Save Draft to localStorage (Phase 5: versioned v2 with error handling)
 */
function queueDraftSave() {
  if (isApplyingRemoteChange) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (isApplyingRemoteChange) return;
    const draft = {
      draftVersion: 2,
      docType: getSelectedDocType(),
      university: universityInput.value,
      department: departmentInput.value,
      level: levelSelect.value,
      term: termSelect.value,
      courseCode: courseCodeInput.value,
      courseTitle: courseTitleInput.value,
      docNumber: docNumberInput.value,
      docTitle: docTitleInput.value,
      comment: commentInput.value,
      studentName: studentNameInput.value,
      studentId: studentIdInput.value,
      experimentDate: experimentDateInput.value,
      submissionDate: submissionDateInput.value,
      teachers: teachers.map((t) => ({
        role: t.role,
        name: t.name,
        designation: t.designation
      }))
    };

    const res = saveDraft(draft);
    if (res && res.success === false) {
      if (res.reason === 'quota') {
        setStorageStatus('Storage full — clear the form or remove the logo to save more.', 'warning');
      } else {
        setStorageStatus('Local saving unavailable in this browser.', 'warning');
      }
    } else {
      setStorageStatus('Draft saved.', 'saved');
    }
  }, 500);
}

/**
 * Restore Draft from localStorage (Phase 5: robust error handling & v1 migration)
 */
function restoreDraft() {
  const res = loadDraft();
  if (!res) return false;

  if (res.status === 'unavailable') {
    setStorageStatus('Local saving unavailable in this browser.', 'warning');
    return false;
  }
  if (res.status === 'corrupt') {
    setStorageStatus('Previous draft could not be restored.', 'warning');
    return false;
  }
  if (res.status === 'newer_version') {
    setStorageStatus('Draft format is newer than this app.', 'warning');
    return false;
  }
  if (res.status === 'empty' || !res.data) {
    return false;
  }

  const draft = res.data;
  applyDraftToForm(draft);

  // If legacy v1 draft without version, save upgraded v2 draft
  if (!draft.draftVersion || draft.draftVersion < 2) {
    saveDraft({
      ...draft,
      draftVersion: 2,
      teachers: teachers.map((t) => ({ ...t }))
    });
  }

  return true;
}

/**
 * Handle Start Over / Clear Form action with confirmation
 */
async function handleClearForm() {
  const confirmed = window.confirm(
    'Clear all fields, the uploaded logo, and the saved draft? This cannot be undone.'
  );
  if (!confirmed) return;

  if (saveTimeout) clearTimeout(saveTimeout);

  teachers = [{ role: '', name: '', designation: '' }];

  universityInput.value = '';
  departmentInput.value = '';
  levelSelect.value = '';
  termSelect.value = '';
  courseCodeInput.value = '';
  courseTitleInput.value = '';
  docNumberInput.value = '';
  docTitleInput.value = '';
  commentInput.value = '';
  studentNameInput.value = '';
  studentIdInput.value = '';
  experimentDateInput.value = '';
  submissionDateInput.value = '';

  try {
    logoUploadInput.value = '';
  } catch {
    // ignore
  }
  logoErrorEl.textContent = '';

  const labRadio = document.getElementById('doc-type-lab');
  if (labRadio) labRadio.checked = true;

  clearDraft();
  await deleteLogo();

  handleDocTypeChange();
  updateCourseLists();
  renderTeacherForm();
  renderTeacherPreview();
  syncAllToPreview();

  if (logoBoxEl) {
    logoBoxEl.innerHTML = DEFAULT_LOGO_SVG;
  }

  setStorageStatus('Cleared.', 'saved');
  universityInput.focus();
}

/**
 * Cross-Tab Storage Event Handler
 */
function onStorageChange(e) {
  if (e.key !== 'covercraft-draft-v1') return;

  if (e.newValue === null) {
    setStorageStatus('Draft was cleared in another tab.', 'warning');
    return;
  }

  try {
    const remoteDraft = JSON.parse(e.newValue);
    if (!remoteDraft || typeof remoteDraft !== 'object') return;

    const currentDraft = getCurrentFormDraft();
    if (areDraftsEqual(currentDraft, remoteDraft)) {
      return;
    }

    isApplyingRemoteChange = true;
    try {
      applyDraftToForm(remoteDraft);
      handleDocTypeChange();
      updateCourseLists();
      renderTeacherForm();
      renderTeacherPreview();
      syncAllToPreview();
      setStorageStatus('Draft updated from another tab.', 'saved');
    } finally {
      isApplyingRemoteChange = false;
    }
  } catch (err) {
    console.warn('Failed to parse remote draft from storage event:', err);
  }
}

/**
 * Surface storage status with deduplication throttling (500ms)
 * textContent only — no innerHTML.
 */
function setStorageStatus(msg, state = '') {
  if (!storageStatusEl || !msg) return;
  const now = Date.now();
  if (msg === lastStatusMessage && now - lastStatusTime < 500) {
    return;
  }
  lastStatusMessage = msg;
  lastStatusTime = now;
  storageStatusEl.textContent = msg;
  storageStatusEl.className = ('storage-status ' + state).trim();
}

/**
 * Scale A4 Preview to fit viewport width without horizontal scroll
 */
function scalePreview() {
  if (!previewViewport || !coverPreviewWrapper || !a4CoverEl) return;
  const viewportWidth = previewViewport.clientWidth - 32;
  const coverWidth = a4CoverEl.offsetWidth || 794;
  const scale = Math.min(1, Math.max(0.1, viewportWidth / coverWidth));

  coverPreviewWrapper.style.transform = `scale(${scale})`;
  coverPreviewWrapper.style.transformOrigin = 'top left';

  const coverHeight = a4CoverEl.offsetHeight || 1123;
  previewViewport.style.height = `${Math.ceil(coverHeight * scale) + 32}px`;
}

/**
 * Initialize Application
 */
async function init() {
  // 1. Fetch dropdown data
  try {
    const res = await fetch('data/dropdowns.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dropdownData = await res.json();

    // Populate universities
    universitiesDatalist.textContent = '';
    (dropdownData.universities || []).forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.name;
      universitiesDatalist.appendChild(opt);
    });

    // Populate departments
    departmentsDatalist.textContent = '';
    (dropdownData.departments || []).forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.name;
      departmentsDatalist.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load dropdowns.json:', err);
    setStorageStatus('Notice: Catalog suggestions unavailable. Free typing enabled.', 'warning');
  }

  // 2. Restore Draft (including teachers)
  const hasDraft = restoreDraft();

  // 3. Setup Doc Type
  handleDocTypeChange();

  // 4. Update Course Lists cascade
  updateCourseLists();

  // 5. Render Teacher Form and Preview
  renderTeacherForm();
  renderTeacherPreview();

  // 6. Sync inputs to Preview
  syncAllToPreview();

  // 7. Restore Logo from Storage
  let logoRestored = false;
  try {
    const logoBlob = await loadLogo();
    if (logoBlob) {
      renderLogoInPreview(logoBlob);
      logoRestored = true;
    }
  } catch (err) {
    console.warn('Could not load logo:', err);
  }

  // 8. Initial storage feedback
  if (!isStorageAvailable) {
    setStorageStatus('Local saving unavailable in this browser.', 'warning');
  } else if (hasDraft) {
    setStorageStatus('Draft restored.', 'saved');
  } else if (logoRestored) {
    setStorageStatus('Logo restored.', 'saved');
  }

  // 9. Preview scale adjustment
  scalePreview();
  window.addEventListener('resize', scalePreview);

  // 10. Event Listeners
  docTypeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      handleDocTypeChange(true);
      syncAllToPreview();
    });
  });

  // Cascade triggers
  departmentInput.addEventListener('input', () => {
    updatePreviewField('department-name', departmentInput.value);
    updateCourseLists();
    queueDraftSave();
  });

  levelSelect.addEventListener('change', () => {
    updatePreviewField('level', levelSelect.value);
    updateCourseLists();
    queueDraftSave();
  });

  termSelect.addEventListener('change', () => {
    updatePreviewField('term', termSelect.value);
    updateCourseLists();
    queueDraftSave();
  });

  // Course Code & Title
  courseCodeInput.addEventListener('input', () => {
    updatePreviewField('course-code', courseCodeInput.value);
    handleCourseCodeInput();
    queueDraftSave();
  });

  courseTitleInput.addEventListener('input', () => {
    updatePreviewField('course-title', courseTitleInput.value);
    handleCourseTitleInput();
    queueDraftSave();
  });

  // Field live bindings
  universityInput.addEventListener('input', () => {
    updatePreviewField('university-name', universityInput.value);
    queueDraftSave();
  });

  docNumberInput.addEventListener('input', () => {
    updatePreviewField('doc-number', docNumberInput.value);
    updatePreviewField('report-no', docNumberInput.value);
    queueDraftSave();
  });

  docTitleInput.addEventListener('input', () => {
    updatePreviewField('doc-title', docTitleInput.value);
    updatePreviewField('report-title', docTitleInput.value);
    queueDraftSave();
  });

  commentInput.addEventListener('input', () => {
    updatePreviewField('comment-box', commentInput.value);
    queueDraftSave();
  });

  studentNameInput.addEventListener('input', () => {
    updatePreviewField('student-name', studentNameInput.value);
    queueDraftSave();
  });

  studentIdInput.addEventListener('input', () => {
    updatePreviewField('student-id', studentIdInput.value);
    queueDraftSave();
  });

  experimentDateInput.addEventListener('input', () => {
    updatePreviewField('experiment-date', formatDate(experimentDateInput.value));
    queueDraftSave();
  });

  submissionDateInput.addEventListener('input', () => {
    updatePreviewField('submission-date', formatDate(submissionDateInput.value));
    queueDraftSave();
  });

  // Multi-Teacher Form Interaction Listeners
  if (teachersFormContainer) {
    // Input delegation
    teachersFormContainer.addEventListener('input', (event) => {
      const target = event.target;
      if (
        !target.classList.contains('t-role') &&
        !target.classList.contains('t-name') &&
        !target.classList.contains('t-designation')
      ) {
        return;
      }
      const index = parseInt(target.dataset.index, 10);
      const prop = target.dataset.prop;
      if (!isNaN(index) && teachers[index] && prop) {
        teachers[index][prop] = target.value.trimStart();
        renderTeacherPreview();
        queueDraftSave();
      }
    });

    // Remove button delegation
    teachersFormContainer.addEventListener('click', (event) => {
      const btn = event.target.closest('.t-remove');
      if (!btn) return;
      if (teachers.length <= 1) return;
      const index = parseInt(btn.dataset.index, 10);
      if (!isNaN(index) && index >= 0 && index < teachers.length) {
        teachers.splice(index, 1);
        renderTeacherForm();
        renderTeacherPreview();
        queueDraftSave();
      }
    });
  }

  // Add teacher button
  if (addTeacherBtn) {
    addTeacherBtn.addEventListener('click', () => {
      teachers.push({ role: '', name: '', designation: '' });
      renderTeacherForm();
      renderTeacherPreview();
      const newNameInput = teachersFormContainer.querySelector(
        `.teacher-row[data-index="${teachers.length - 1}"] .t-name`
      );
      if (newNameInput) newNameInput.focus();
      queueDraftSave();
    });
  }

  // Logo upload & remove
  logoUploadInput.addEventListener('change', handleLogoUpload);
  removeLogoBtn.addEventListener('click', handleRemoveLogo);

  // Clear Form ("Start over") button
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', handleClearForm);
  }

  // Cross-tab storage synchronization
  window.addEventListener('storage', onStorageChange);
}

document.addEventListener('DOMContentLoaded', init);
