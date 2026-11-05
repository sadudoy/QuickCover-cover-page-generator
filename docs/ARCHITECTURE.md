# Quick Cover — Architectural Documentation

## 1. Architectural Philosophy & Strategy
**Cover Page Generator** is designed as a zero-dependency, entirely client-side web application. It eliminates operational complexity by performing all state management, real-time rendering, and document exports directly within the client's browser runtime.

### Technical Stack
- **Presentation Layer**: Semantic HTML5 markup, uncompiled standard CSS3.
- **Application Logic**: Vanilla JavaScript ES Modules (`import`/`export`), natively loaded via `<script type="module">`.
- **Local Development Server**: Dependency-free HTTP static server implemented using standard Node.js built-in modules (`node:http`, `node:fs`, `node:path`, `node:url`).
- **Testing Engine**: Node.js built-in test runner (`node --test`) using `node:assert/strict`. No external testing libraries or transpilers.

---

## 2. Documented Deviation from UniFare
The reference predecessor project, **UniFare**, employed a full-stack architecture comprising an Express.js server, PostgreSQL relational database, session management, and server-side route controllers.

### Rationale for Zero-Backend in Cover Page Generator
1. **No Communal or Shared State**: Cover Page Generator is an isolated document generator. Every user works solely on their own cover page; there is no shared schedule, booking data, or multi-user state requiring a central database.
2. **Instant Feedback & Zero Latency**: All document preview updates occur synchronously in memory via the browser DOM, providing sub-millisecond preview feedback without HTTP roundtrips.
3. **Zero Hosting & Maintenance Burden**: A static client can be hosted freely and globally on any static edge CDN (e.g., GitHub Pages, Cloudflare Pages, Vercel) without provisioning server instances, maintaining database connections, or running database migrations.
4. **Data Privacy**: Student information (names, student IDs, submission dates, logos) stays strictly inside the student's browser and is never transmitted over the network to a third-party server.

### Fallback Stack (If Backend Is Ever Required)
If future requirements necessitate cloud features (such as university-wide single sign-on, centralized departmental template synchronizations, or cloud document archives), the project will mirror the proven **UniFare** stack:
- **Runtime**: Node.js with Express.js REST API.
- **Database**: PostgreSQL with parameterized queries via `pg`.
- **Authentication**: HTTP-only secure cookie session management.
- **Migration Path**: The client-side ES module architecture is decoupled from storage, allowing state stores to swap local persistence for REST/JSON API endpoints without rewriting UI or rendering components.

---

## 3. Directory Layout
The repository maintains a clean, modular structure with zero build configuration:

```text
cover-page-generator/
├── client/                     # Static client root served by dev server
│   ├── css/
│   │   ├── site.css            # Shared design system: tokens, typography, header/footer, controls
│   │   ├── landing.css         # Landing page layout, hero, 6-card feature grid, how-it-works, CTA
│   │   ├── form.css            # Tool page layout, multi-teacher styles, preview pane, scaler
│   │   └── cover.css           # A4 exact print canvas styles, millimetric positioning
│   ├── data/
│   │   └── dropdowns.json      # Presets for universities, departments, levels, terms, courses
│   ├── js/
│   │   ├── site.js             # Shared site script: footer dynamic year
│   │   ├── create.js           # Tool interactions, cascading dropdowns, teachers manager, preview
│   │   └── storage.js          # IndexedDB logo persistence & localStorage draft management
│   ├── index.html              # Modern, professional product landing page
│   ├── create.html             # Interactive cover page generator tool
│   ├── cover-lab.html          # Static lab report reference template
│   └── cover-assignment.html   # Static assignment reference template
├── docs/                       # Comprehensive documentation
│   ├── ARCHITECTURE.md         # System design and stack justification
│   ├── DESIGN_ANALYSIS.md      # Measured analysis of reference PDFs & comparison
│   ├── DEVELOPMENT.md          # Workflow, execution, and testing guides
│   ├── PROJECT_SPEC.md         # Requirements, scope, and assumptions
│   └── PROJECT_STATUS.md       # Milestones, verification, and phase tracking
├── reference/                  # Design assets and inspection artifacts
│   ├── assignment-demo.pdf     # Official assignment reference template
│   ├── lab-report-demo.pdf     # Official lab report reference template
│   └── rendered/               # Rendered reference page images (200 DPI PNGs & viewport screenshots)
│       ├── assignment-page-1.png
│       ├── lab-report-page-1.png
│       ├── landing-360.png
│       ├── landing-768.png
│       ├── landing-1280.png
│       ├── create-768.png
│       └── create-1280.png
├── scripts/                    # Development tooling and automation
│   ├── dev-server.js           # Zero-dependency Node.js HTTP server
│   ├── inspect-pdf.py          # PDF inspection and rasterization script
│   ├── render-cover.js         # Chrome headless static cover renderer
│   ├── test-phase4-interactions.js # Automated Chromium CDP multi-teacher interaction tests
│   └── verify-phase4-5.js      # Phase 4.5 HTTP endpoints and multi-viewport screenshots
├── tests/                      # Automated test suite
│   ├── index.js                # Test runner entry point
│   └── smoke.test.js           # Comprehensive smoke test suite (27 passing assertions)
├── .gitignore                  # Git ignore rules
├── package.json                # Project scripts (dev, test)
└── README.md                   # Quick start and project overview
```

---

## 4. Dual-Cover Template Architecture

### Decision on One vs Two Templates
As established in [`docs/DESIGN_ANALYSIS.md`](file:///d:/CSE/Projects/cover-page-generator/docs/DESIGN_ANALYSIS.md), while the **Assignment** and **Lab Report** covers share 90% commonality (canvas, typography, borders, logo, dual cards), they differ in title casing, metadata labels, colon alignment, student card fields (Experiment Date present only in Lab Report), and card heights.

Phase 2 will implement **ONE shared dynamic component** driven by a root dataset attribute:
```html
<article class="a4-cover-page" data-cover-type="assignment">
  <!-- Dynamic title and metadata slots -->
</article>
```
- **Benefits**:
  - Eliminates template code duplication.
  - Fixes and typographic improvements immediately apply to both document types.
  - Allows instantaneous switching between types without DOM recreation.

---

## 5. Integrating Form Requirements Without Stack Changes

### 5.1 Select-or-Type Fields (`<input list>` + `<datalist>`)
- Four fields: University Name, Department Name, Course Code, and Course Title.
- Backed by an editable ES module configuration (`client/js/config/courses.js`).
- Linked two-way auto-fill between Course Code and Course Title is implemented via lightweight JavaScript event listeners (`input` / `change`) that match typed entries against the catalog array.
- Allows arbitrary custom text with zero validation blockers.

### 5.2 Select-Only Fixed Fields (`<select>`)
- Two fields: Level (`1`, `2`, `3`, `4`) and Term (`I`, `II`).
- Hardcoded `<option>` values inside standard semantic `<select>` elements.
- Guaranteed valid inputs for downstream print formatting.

### 5.3 Dynamic Multiple Teachers List
- In-memory array state: `teachers: [{ name, designation }]`.
- Add/Remove buttons mutate the array and trigger a DOM re-render of the "Submitted To" container.
- Container CSS uses flexbox or grid layout to vertically partition rows within the allocated bounding height.

### 5.4 Logo Persistence
- Uploaded image converted to base64 data URL via `FileReader.readAsDataURL()`.
- Persisted in browser storage (`localStorage` / `IndexedDB`).
- Rehydrated automatically on application initialization before initial preview render.
