# Quick Cover — Project Status & Roadmap

## 1. Project Phase Matrix

| Phase | Description | Status | Verification Notes |
| :--- | :--- | :--- | :--- |
| **Phase 01** | **Dual Reference Intake, Foundation & Analysis** | **IMPLEMENTED — VERIFIED** | Both `lab-report-demo.pdf` and `assignment-demo.pdf` confirmed present and rasterized. Dev server active, smoke tests pass, comparative analysis complete with recommendation for single shared template. |
| **Phase 02** | **Static Cover Template & Exact CSS A4 Geometry** | **IMPLEMENTED — VERIFIED** | Created `client/css/cover.css`, `client/cover-lab.html`, `client/cover-assignment.html`, and `scripts/render-cover.js`. Visual match against reference PNGs verified via headless Chrome screenshots. Smoke tests pass. |
| **Phase 03** | **Interactive Form, Live Preview & Persistence** | **IMPLEMENTED — VERIFIED** | Interactive tool at `/create.html`, live event bindings, cascading course dropdowns (`dropdowns.json`), IndexedDB logo storage with localStorage fallback, form draft persistence. Automated CDP interaction suite verified. |
| **Phase 04** | **Multiple Teachers: Dynamic "Submitted To" List** | **IMPLEMENTED — VERIFIED** | Dynamic teacher rows (role, name, designation datalists), remove/add buttons, single signature line pinned at bottom, synchronized card auto-growth, schema migration. 10/10 automated CDP interaction tests pass. |
| **Phase 04.5** | **Professional Site Design & Landing Page** | **IMPLEMENTED — VERIFIED** | Shared design system in `client/css/site.css`, `client/css/landing.css`, `client/js/site.js`, semantic landing page at `/index.html` with inline stroke SVGs and A4 wireframe mockup, restyled `/create.html` and `form.css` with token system. Multi-viewport screenshots verified. |
| **Phase 04.6** | **Quick Cover Rebrand + UI Reference Pattern Match** | **IMPLEMENTED — VERIFIED** | Rebranded project to "Quick Cover" across package.json, HTML, README, and docs. Extracted pattern from `quick_cover_ui_reference.html` into `docs/UI_REFERENCE_ANALYSIS.md`. Aligned `create.html` and `form.css` with 420px/flexible workspace grid, segmented buttons, input styling, and `#edf0f5` preview panel framing with neutral-disciplined shadows. 32 smoke tests pass, 10/10 interaction tests pass. |
| **Phase 05** | **Print-to-PDF Export & Print CSS Hardening** | **PLANNED** | Precision `@page` print stylesheet, export button, zero-margin edge printing, print-mode verification. |

---

## 2. Reference Asset Confirmation
- [x] **Lab Report Reference**: Confirmed present at [`reference/lab-report-demo.pdf`](file:///d:/CSE/Projects/cover-page-generator/reference/lab-report-demo.pdf) (94,482 bytes).
- [x] **Assignment Reference**: Confirmed present at [`reference/assignment-demo.pdf`](file:///d:/CSE/Projects/cover-page-generator/reference/assignment-demo.pdf) (92,204 bytes).
- [x] **Rendered Visuals**: Both rasterized at 200 DPI in [`reference/rendered/`](file:///d:/CSE/Projects/cover-page-generator/reference/rendered/).
- [x] **Viewport Screenshots**: Captured in [`reference/rendered/`](file:///d:/CSE/Projects/cover-page-generator/reference/rendered/) (`landing-360.png`, `landing-768.png`, `landing-1280.png`, `create-768.png`, `create-1280.png`).

---

## 3. Active Technical TBDs
- [x] **TBD-04**: Multi-teacher layout rules: Settled via Option A with auto-growing synchronized bottom cards and single shared signature line.
- [x] **TBD-05**: Course catalog preset data to embed in `client/data/dropdowns.json`.
- [x] **TBD-06**: Logo storage mechanism (`IndexedDB` with `localStorage` fallback).
- **TBD-07**: Cross-platform system font fallbacks for Times New Roman.
- **TBD-08**: Offline PWA caching strategy (deferred).
