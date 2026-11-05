# Quick Cover — Project Specification

## 1. Purpose & Vision
**Cover Page Generator** is a lightweight, zero-dependency, client-side web application designed to help university students generate beautifully formatted, standardized, and print-ready cover pages matching their department's institutional templates exactly.

The application eliminates formatting errors and misalignments common in word processor templates through a streamlined 3-step workflow:
1. **Select Type & Fill Details**: Choose cover type (**Assignment** or **Lab Report**), fill student/course metadata with smart autocomplete and dropdowns.
2. **Live A4 Preview**: Immediately inspect a pixel-perfect, scaled A4 preview matching official print specifications.
3. **Export PDF**: Print directly to PDF via the browser's native print engine using precision `@page` CSS rules.

---

## 2. Target Users
- **Primary Users**: University engineering and science undergraduates (initially BAUST CSE students) requiring standardized covers for assignments and lab reports.
- **Operating Environment**: Modern desktop and mobile web browsers without requiring account registration, software installation, or third-party plugins.

---

## 3. Technology Stack & Architectural Decision
- **Frontend Core**:
  - Semantic HTML5 structure.
  - Standard CSS3 utilizing CSS variables and standard `@page` print rules.
  - Vanilla JavaScript ES Modules (`import`/`export`) natively loaded via `<script type="module">`.
  - **No build steps, no bundlers, no CSS frameworks (no Tailwind), no UI component libraries.**
- **Backend Architecture**:
  - **None**. The app executes 100% within the browser sandbox.
  - **Justification**: Generating static print documents requires no server-side compute or remote database. This ensures zero hosting costs, high reliability, zero latency, offline readiness, and complete privacy for student data.

---

## 4. Document Types Supported
The application supports **TWO distinct document types**:
1. **Assignment Cover**:
   - Banner: `"Assignment"` (Title Case).
   - Document metadata: `"Assignment no."`, `"Assignment Title"`, `"Comment"`.
   - Date fields: `"Submission Date"` only (no experiment date).
   - Reference: [`reference/assignment-demo.pdf`](file:///d:/CSE/Projects/cover-page-generator/reference/assignment-demo.pdf).
2. **Lab Report Cover**:
   - Banner: `"LAB REPORT"` (All Caps).
   - Document metadata: `"Report no."`, `"Report Title"`, `"Comment"`.
   - Date fields: **Both** `"Experiment Date"` and `"Submission Date"`.
   - Reference: [`reference/lab-report-demo.pdf`](file:///d:/CSE/Projects/cover-page-generator/reference/lab-report-demo.pdf).

The student selects the document type via a radio button or toggle at the top of the form, which dynamically updates the template structure and field visibility.

---

## 5. Functional Requirements & Field Categorization

### 5.1 Category A: Select-or-Type Fields (`<input list>` + `<datalist>`)
Four metadata fields allow either picking from editable client-side catalog suggestions or typing custom free-text entries:
1. **University Name**: Defaults to institutional preset (e.g., `"Bangladesh Army University of Science and Technology (BAUST), Saidpur"`).
2. **Department Name**: Defaults to departmental preset (e.g., `"Department of Computer Science and Engineering (CSE)"`).
3. **Course Code**: Suggested from catalog (e.g., `"CSE 3100"`, `"CSE 3101"`).
4. **Course Title**: Suggested from catalog (e.g., `"Database Management Systems"`, `"Web Engineering Lab"`).

**Linked Auto-Fill Behavior**:
- Selecting or typing a known **Course Code** automatically populates the corresponding **Course Title**.
- Selecting or typing a known **Course Title** automatically populates the corresponding **Course Code**.
- Typing an unrecognized entry is preserved as-is without validation errors.

**Independence Assumption**:
- In the MVP, University and Department lists operate independently (no cascading parent-child filter).

### 5.2 Category B: Select-Only Fixed Enumerations (Standard `<select>`)
Two academic progress fields are strictly constrained to fixed departmental options without custom text or "Other" fallbacks:
1. **Level**:
   - Values: `"1"`, `"2"`, `"3"`, `"4"`
   - UI Display: `"Level 1"`, `"Level 2"`, `"Level 3"`, `"Level 4"`
   - Printed Output: `"Level: 1"` … `"Level: 4"`
2. **Term**:
   - Values: `"I"`, `"II"` (Roman numerals)
   - UI Display: `"Term I"`, `"Term II"`
   - Printed Output: `"Term: I"`, `"Term: II"`

*Both fields are mandatory before PDF export.*

### 5.3 Category C: Multiple Teachers Management ("Submitted To" Block)
- Supports one or more instructors in a single "Submitted To" block (e.g. Course Teacher + Lab Instructor).
- **Data Model**: Dynamic list of teacher entries:
  ```json
  [
    { "role": "Course Teacher", "name": "Prof. Dr. Jane Doe", "designation": "Professor & Head of Department" },
    { "role": "Lab Instructor", "name": "John Smith", "designation": "Lecturer" }
  ]
  ```
- **Fields**:
  - `role`: Optional datalist (`Course Teacher`, `Lab Instructor`, `Supervisor`, `Thesis Supervisor`, `Academic Advisor`). If omitted, display defaults to `Teacher Name:`.
  - `name`: Required for preview display.
  - `designation`: Optional datalist (`Lecturer`, `Assistant Professor`, `Associate Professor`, `Professor`, `Adjunct Faculty`).
- **UI Interaction**: Form provides an "+ Add teacher" action and individual "Remove" (`×`) buttons for each entry (disabled when only 1 teacher remains).
- **Rendering Constraints (Option A Architecture)**:
  - Default (1 teacher): matches Phase 2 reference geometry pixel-for-pixel.
  - Multi-teacher (2+ teachers): entries stack vertically inside `[data-field="teachers-list"]`. A single shared "Signature & Date: _________________" line remains pinned at the bottom of the card.
  - Card Growth: Both bottom cards (`Submitted By` and `Submitted To`) stretch downward together in unison to accommodate additional teachers while preserving min-height.

### 5.4 Category D: Logo Upload & Session Persistence
- Students can upload a custom university logo/crest image (PNG, JPEG, SVG, WebP; maximum 2MB).
- **Session Persistence**: Uploaded logo persists in IndexedDB (`covercraft` / `logo` / `current`) with transparent `localStorage` fallback.
- **Draft Persistence**: Form fields auto-save to `localStorage` (`covercraft-draft-v1`) with 500ms debounce and automatic migration for older draft schemas.

---

## 6. MVP Scope Boundary

### In Scope
- Form interface with document-type selector, Category A datalists, Category B select menus, dynamic multi-teacher manager, and logo uploader.
- Live synchronous A4 canvas preview reflecting all form inputs in real time.
- Single shared template component driven by CSS variant classes (`data-cover-type`).
- Print-to-PDF export triggered via `window.print()` styled with precise `@page` CSS.
- Automated smoke testing via Node.js native test runner (`node --test`).

### Out of Scope (Deferred)
- User authentication, login accounts, and cloud profile syncing.
- Multi-page report body generator (strictly cover page only).
- Server-side PDF rendering (Puppeteer/LaTeX microservices).
- Centralized server-managed course catalogs (out of MVP scope).
- PWA service worker and offline application caching (deferred to future phase).

---

## 7. Explicit Technical TBD List
- [x] **TBD-01: Document Type Variations**: Settled by comparative analysis. Assignment has 4 student fields (no Experiment Date); Lab Report has 5 student fields (includes Experiment Date).
- [x] **TBD-02: Term Rendering Format**: Settled by analysis. Terms render as Roman numerals (`Term: I`, `Term: II`).
- [x] **TBD-03: One vs Two Templates**: Settled by analysis. Recommended **ONE shared dynamic component** driven by `data-cover-type`.
- [x] **TBD-04: Multi-Teacher Visual Layout**: Settled via Option A. Single shared signature line at the bottom; both bottom cards expand downward together.
- [x] **TBD-05: Course Catalog Preset Data**: Seeded via `client/data/dropdowns.json` covering EEE, IPE, and BBA catalogs.
- [x] **TBD-06: Logo Persistence Storage Mechanism**: Settled via IndexedDB Blob store with transparent localStorage Data URL fallback.
- [ ] **TBD-07: Typography Fallback Strategy**: Font stack priority for systems lacking native Times New Roman (`"Times New Roman", "Tinos", "Liberation Serif", serif`).
- [ ] **TBD-08: Progressive Web App (PWA) Offline Support**: Deferred until core interactive features are verified.
