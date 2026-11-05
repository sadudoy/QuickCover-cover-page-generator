# Quick Cover — UI Reference Analysis

**Reference Document**: [`reference/quick_cover_ui_reference.html`](file:///d:/CSE/Projects/cover-page-generator/reference/quick_cover_ui_reference.html)  
**File Size**: 18,424 bytes  
**Date Analyzed**: 2026-11-05  

---

## §1 Design Tokens

### 1.1 Color Palette
The reference defines an accent-driven palette anchored by a vibrant royal blue accent against neutral white, cool slate gray, and deep navy text.

| Color Code / Token | Role / Semantic Usage | Occurrences / Context |
| :--- | :--- | :--- |
| `var(--blue)` (`#145bea`) | Primary accent & interactive highlight | Brand mark background, active states, links hover, buttons, focus rings |
| `var(--blue-dark)` (`#104bc4`) | Primary interactive hover state | Hover state for `.btn` |
| `var(--ink)` (`#172033`) | Primary text & headings | Main body text, headings, secondary button text |
| `var(--muted)` (`#697386`) | Secondary / supporting text | Section subtitles, card body text, hints, footer copy |
| `var(--line)` (`#e5e9f1`) | Card & section border lines | Panel borders, feature card borders, footer border, divider lines |
| `var(--surface)` (`#ffffff`) | Card surface background | Form panel, feature cards, mock documents, paper preview |
| `var(--bg)` (`#f6f8fc`) | Alternative section background | Background of `.how` section |
| `var(--soft)` (`#eef4ff`) | Accent tinted badge background | Feature icon container background |
| `#f4f6fa` | Workspace backdrop background | Overall background of `.editor-page` |
| `#edf0f5` | Preview canvas backdrop & nav border | Nav bottom border, `.preview-panel` background |
| `#4e586b` | Unfocused navlink text | Header navigation links |
| `#39445a` | Form field labels & hero copy | Input labels, hero description paragraph |
| `#354158` | Benefit pill text | Text inside hero benefits row |
| `#d9deea` | Input & select border | Text fields, select dropdowns, inactive segmented buttons |
| `#202a3c` | Input field text color | Typed text inside inputs and selects |
| `#344054` | Inactive segmented button text | Document type toggle buttons |
| `#8a93a3` | Form microcopy & hints | `.hint` text below form |
| `#626d80` | Preview toolbar label text | `.preview-toolbar` text (`LIVE PREVIEW`, `A4 · Portrait`) |
| `#101828` | Paper document text | Text inside the rendered paper preview |
| `#1f2937` / `#202b3d` | Document rules & seals | Divider lines and seal borders on preview document |
| `#7a8495` | Editor note text | Subtitle below preview paper |

### 1.2 Typography
- **Font Families**:
  - Chrome / UI: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` *(System fallbacks utilized; no external CDN font loaded)*.
  - Cover Document: `"Times New Roman", serif` *(Native serif preserved strictly for the A4 document)*.
- **Hierarchy & Scale**:
  - **Hero H1**: `clamp(48px, 6vw, 72px)`, weight 800, line-height `1.02`, letter-spacing `-3.8px`.
  - **Section Head H2**: `34px` (mobile `28px`), weight bold, letter-spacing `-1.2px`, margin `0 0 10px`.
  - **CTA H2**: `32px`, weight bold, letter-spacing `-1px`.
  - **Brand Text**: `22px` (editor header `20px`, mobile `17px`), weight 750, letter-spacing `-0.8px`.
  - **Hero Copy / Intro**: `21px` (mobile `18px`), weight 400, line-height `1.5`, margin `0 0 27px`.
  - **Paper Type Title**: `21px`, weight 700.
  - **Panel Title**: `16px`, weight 750, margin `0 0 20px`.
  - **Feature / Step H3**: `16px`, weight 700 / 650.
  - **Nav Links / Buttons / Feature Body / Step Body**: `14px`, line-height `1.5`–`1.6`.
  - **Input Text / Select Text / Segmented Buttons**: `13px`, height `39px`.
  - **Footer Text / Paper Metadata**: `13px`.
  - **Eyebrow / Field Labels / Toolbar Meta**: `12px`, weight 700–750, letter-spacing `1.5px` (uppercase for eyebrow/toolbar).
  - **Form Hints / Editor Note**: `11px`, weight 400.

### 1.3 Spacing Scale
- **Gaps**: `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `22px`, `28px`, `34px`, `40px`.
- **Paddings**:
  - Controls: `0 11px` (inputs), `9px 14px` (`.btn.small`), `12px 18px` (`.btn`).
  - Containers: `10px` / `15px` / `18px` / `20px` / `24px` / `28px`.
  - Page sections: `58px 0` (mobile), `78px 0` (desktop).
- **Margins**: `4px`, `5px`, `7px`, `8px`, `10px`, `12px`, `14px`, `15px`, `18px`, `20px`, `22px`, `27px`, `30px`, `38px`.

### 1.4 Radii
- `3px`: Mock document indicator lines (`.doc-lines i`).
- `7px`: Form inputs, select dropdowns, segmented toggle buttons (`.field input`, `.segmented button`).
- `8px`: Brand mark container (`.brand-mark`).
- `9px`: Action buttons (`.btn`).
- `10px`: Feature card icon badge (`.feature-icon`).
- `12px`: Tool page panels (`.panel`).
- `13px`: Feature cards (`.feature`).
- `50%`: Circular elements (step numbers, seal, logo circles).

### 1.5 Box Shadows
- **Action Buttons (`.btn`)**: `0 4px 10px #145bea20`.
- **Tool Workspace Panels (`.panel`)**: `0 2px 8px #15264a08`.
- **Form Controls Focus**: `0 0 0 3px #145bea15`.
- **Preview Document (`.paper`)**: `0 3px 18px #1e2a421a`.
- **Hero Mock Document (`.mock-doc`)**: `0 18px 38px #23365a25`.

---

## §2 Layout Pattern

### 2.1 Page Grid
- **Landing Container (`.shell`)**: Max-width `1200px`, auto-centered, horizontal padding `28px` (mobile `19px`).
- **Tool Workspace (`.workspace`)**: Max-width `1500px`, auto-centered, padding `18px` (mobile `10px`), gap `16px`.

### 2.2 Tool-Page Structural Layout
- **Header (`.editor-top`)**:
  - Height: `68px`, background `#ffffff`, border-bottom `1px solid var(--line)`.
  - Left: `.brand` (`.brand-mark` + `Quick Cover`).
  - Right: `.editor-actions` with two buttons: secondary small (`← Back to Home`) and primary small (`Download PDF`).
- **Tool Workspace Split**:
  - Desktop layout: Two-column grid `display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 16px;`.
  - Left Column (Form Panel): `420px` fixed width, `height: fit-content`.
  - Right Column (Preview Panel): Flexible `minmax(0, 1fr)`.

### 2.3 Form Panel Internal Layout
- Contained in a white card with `border: 1px solid var(--line)`, `border-radius: 12px`, padding `20px`.
- Heading: `.panel-title` with icon prefix, `16px`, weight 750, margin-bottom `20px`.
- Stacked fields: Vertical stack of `.field` divs (`margin-bottom: 15px`).
- Labels: Block elements sitting strictly **above** inputs (`display: block; font-size: 12px; font-weight: 700; color: #39445a; margin-bottom: 7px`).
- In-line grids:
  - Document type toggle: `.segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }`.
  - Two-column pairs (e.g. Level/Term, Student Name/ID): `.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }`.

### 2.4 Preview Panel Framing
- Outer wrapper: `.panel.preview-panel` with background `#edf0f5` (soft slate grey-blue backdrop), `border: 1px solid var(--line)`, `border-radius: 12px`, padding `18px`.
- Toolbar (`.preview-toolbar`): Positioned at top of panel, flex row with `LIVE PREVIEW` and `A4 · Portrait` in uppercase microcopy (`12px`, color `#626d80`).
- Canvas wrap (`.paper-wrap`): Centers the document canvas with `width: min(100%, 650px); display: flex; justify-content: center; padding: 8px;`.
- Note (`.editor-note`): Centered microcopy below document (`11px`, color `#7a8495`): *"Your changes appear in the document preview as you type."*.

### 2.5 Responsive Breakpoints
- **Tablet / Mobile Breakpoint (`max-width: 850px`)**:
  - Workspace collapses to a single vertical column: `grid-template-columns: 1fr;`.
  - Explicit ordering: `.form-panel { grid-row: 1; }`, `.preview-panel { grid-row: 2; min-height: 660px; }`.
- **Small Mobile Breakpoint (`max-width: 520px`)**:
  - Workspace padding drops to `10px`, gap drops to `10px`.
  - Form panel padding drops to `15px`.
  - Header padding drops to `0 14px`, brand font size to `17px`, secondary action button hidden (`display: none`).

---

## §3 Component Shapes

### 3.1 Header Chrome
- Clean, minimal horizontal bar, height `68px`.
- Brand Mark: `34px` &times; `38px` rounded pill/rectangle, `border-radius: 8px`, solid `var(--blue)` background, centering an SVG document icon in `#ffffff`.
- Brand Text: Inter font, `20px`–`22px`, letter-spacing `-0.8px`, with the word "Cover" optionally tinted blue.

### 3.2 Buttons
- **Primary Button (`.btn`)**:
  - Dimensions: `padding: 12px 18px`, `font-size: 14px`, `font-weight: 650`.
  - Shape: `border: 0; border-radius: 9px;`.
  - Palette: Background `var(--blue)`, color `#ffffff`.
  - Motion: `transition: .18s;`, hover `transform: translateY(-1px)`, active/hover background `var(--blue-dark)`.
- **Secondary Button (`.btn.secondary`)**:
  - Shape: Background `#ffffff`, color `var(--ink)`, `border: 1px solid var(--line)`, `border-radius: 9px`.
- **Small Modifier (`.btn.small`)**:
  - `padding: 9px 14px; font-size: 14px;`.
- **Full Width Modifier (`.btn.full`)**:
  - `width: 100%;`.

### 3.3 Inputs, Selects, and Textareas
- Dimensions: Height `39px`, padding `0 11px`, font-size `13px`.
- Shape: `border: 1px solid #d9deea`, `border-radius: 7px`, background `#ffffff`, color `#202a3c`.
- Focus Interaction: `outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px #145bea15;`.

### 3.4 Segmented Toggle Controls
- Container: `.segmented` grid with `gap: 8px`.
- Options: Individual `<button>` elements, height `37px`, border `1px solid #d9deea`, `border-radius: 7px`, font-size `13px`, background `#ffffff`, text `#344054`.
- Active State: `.active` class switches background to `var(--blue)`, border to `var(--blue)`, and text to `#ffffff`.

### 3.5 Workspace Panels
- Background: Surface white (`#ffffff`) for form; cool slate tinted (`#edf0f5`) for preview.
- Border: `1px solid var(--line)`.
- Radius: `12px`.
- Shadow: `0 2px 8px #15264a08`.

---

## §4 Icons

| # | Role / Usage | Implementation | Exact Markup |
| :--- | :--- | :--- | :--- |
| 1 | Brand mark icon (nav & editor header) | Inline SVG (Stroke, 24&times;24) | `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l5 5v13H6z"/><path d="M15 3v6h5M9 13h8M9 17h8"/></svg>` |
| 2 | Benefit 1 icon ("Fast & easy") | Unicode symbol `↯` | `<b>↯</b>` |
| 3 | Benefit 2 icon ("Live document preview") | Unicode symbol `▤` | `<b>▤</b>` |
| 4 | Benefit 3 icon ("Print-ready PDF") | Unicode symbol `↓` | `<b>↓</b>` |
| 5 | Feature 1 icon ("Live preview") | Unicode symbol `▤` | `<div class="feature-icon">▤</div>` |
| 6 | Feature 2 icon ("Simple details form") | Unicode symbol `✎` | `<div class="feature-icon">✎</div>` |
| 7 | Feature 3 icon ("PDF ready to print") | Unicode symbol `↓` | `<div class="feature-icon">↓</div>` |
| 8 | Editor header action ("Download PDF") | Unicode symbol `↓` | `<button class="btn small" onclick="window.print()">↓ Download PDF</button>` |
| 9 | Editor panel title ("Your Information") | Unicode symbol `▧` | `<span class="pencil">▧</span>` |
| 10 | Editor update preview button | Unicode symbol `↻` | `<button class="btn full" onclick="updatePreview()">↻&nbsp; Update Preview</button>` |
| 11 | CTA forward arrow indicators | Unicode arrow `→` | `&nbsp; →` |
| 12 | Navigation back arrow indicator | Unicode arrow `←` | `← Back to Home` |

---

## §5 Design-Discipline Conflicts & Analysis

The user established a strict design discipline in Phase 4.5:
1. No emoji, no unicode-as-icon.
2. No gradients (linear, radial, or conic).
3. No colored box-shadows or glows (only neutral black/slate rgba tints).
4. No backdrop-filter, no filter: blur.
5. No purple/indigo/violet accent hues.
6. No animated backgrounds or loop animations.
7. Inline SVG icons only, stroke-based (`stroke-width="1.5"`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `aria-hidden="true"`).

### Conflict Inventory in Reference File

| # | Conflict Category | Location in Reference | Exact Value / Code | Discipline Rule Broken | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **C-1** | **CSS Gradient** | Line 11, `.hero` | `background: linear-gradient(115deg, #f5f8ff 0%, #edf3ff 100%);` | "No gradients (linear/radial/conic)" | **Direct Violation** |
| **C-2** | **Colored Box-Shadow** | Line 10, `.btn` | `box-shadow: 0 4px 10px #145bea20;` | "No colored box-shadow, no glow" | **Direct Violation** |
| **C-3** | **Colored Box-Shadow** | Line 11, `.mock-doc` | `box-shadow: 0 18px 38px #23365a25;` | "No colored box-shadow, no glow" | **Direct Violation** |
| **C-4** | **Colored Box-Shadow** | Line 12, `.panel` | `box-shadow: 0 2px 8px #15264a08;` | "No colored box-shadow, no glow" | **Direct Violation** |
| **C-5** | **Colored Focus Ring / Glow** | Line 12, `.field input:focus, .field select:focus` | `box-shadow: 0 0 0 3px #145bea15;` | "No colored box-shadow, no glow" | **Direct Violation** |
| **C-6** | **Colored Box-Shadow** | Line 12, `.paper` | `box-shadow: 0 3px 18px #1e2a421a;` | "No colored box-shadow, no glow" | **Direct Violation** |
| **C-7** | **Unicode-as-Icon** | Line 31, `.benefits span` | `<b>↯</b>`, `<b>▤</b>`, `<b>↓</b>` | "No emoji, no unicode-as-icon" | **Direct Violation** |
| **C-8** | **Unicode-as-Icon** | Lines 42–44, `.feature-icon` | `▤`, `✎`, `↓` | "No emoji, no unicode-as-icon" | **Direct Violation** |
| **C-9** | **Unicode-as-Icon** | Line 59, `.editor-actions button` | `↓ Download PDF` | "No emoji, no unicode-as-icon" | **Direct Violation** |
| **C-10** | **Unicode-as-Icon** | Line 63, `.panel-title .pencil` | `<span class="pencil">▧</span>` | "No emoji, no unicode-as-icon" | **Direct Violation** |
| **C-11** | **Unicode-as-Icon** | Line 76, `.form-panel button` | `↻&nbsp; Update Preview` | "No emoji, no unicode-as-icon" | **Direct Violation** |
| **C-12** | **SVG Stroke Width Mismatch** | Lines 21 & 58, `.brand-mark svg` | `stroke-width="2"` | "stroke-based (stroke-width 1.5)" | Minor Spec Inconsistency |

*(Note: The primary accent `--blue: #145bea` has an HSL hue of ~220°, which is a true cobalt/royal blue, not purple/indigo/violet, and is therefore compliant with color hue constraints.)*

---

### Proposed Compliant Alternatives

To maintain strict adherence to the Phase 4.5 design discipline while executing the visual pattern of Quick Cover:

1. **Gradients (C-1)**:
   - *Alternative*: Replace `.hero` gradient with a solid neutral background `var(--color-bg)` (`#f8fafc`) or subtle solid tint (`#f4f6fa`).
2. **Colored Box-Shadows (C-2, C-3, C-4, C-6)**:
   - *Alternative*: Replace all colored/tinted shadows with the system's neutral slate shadows:
     - Button shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.05)` or subtle slate drop shadow `0 4px 6px -1px rgba(15, 23, 42, 0.08)`.
     - Panel shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)`.
     - Paper shadow: `0 4px 12px 0 rgba(15, 23, 42, 0.12)`.
3. **Focus Rings (C-5)**:
   - *Alternative*: Use a clean CSS outline or neutral ring:
     - `outline: 2px solid var(--blue); outline-offset: 1px;` (no colored blurred box-shadow).
4. **Unicode-as-Icon (C-7 through C-11)**:
   - *Alternative*: Replace all decorative Unicode symbols with 1.5-stroke inline SVGs (`viewBox="0 0 24 24"`, `width="16"`, `height="16"`, `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, `aria-hidden="true"`):
     - Replace `▧` (panel title) with a clean document/edit SVG stroke icon.
     - Replace `↓` (download PDF) with an arrow-down stroke SVG or retain clean text-only "Download PDF".
     - Replace `↻` (update preview) with a refresh/reload SVG stroke icon or retain clean text-only.
     - Keep permitted inline text navigation arrows `"→"` and `"←"` where used as directional prose punctuation.
5. **Brand Mark SVG Stroke Width (C-12)**:
   - *Alternative*: Set `stroke-width="1.5"` on the inline SVG in `.brand-mark`.

---

## §6 Verbatim Style-Affecting Text (UI Chrome)

The following UI chrome strings appear in `reference/quick_cover_ui_reference.html`:

- **Brand Name**: `Quick Cover` (with `.brand-mark` container).
- **Header Navigation**:
  - `Home`
  - `Features`
  - `How it works`
  - `FAQ`
  - `Generate Now →`
- **Hero Chrome**:
  - Eyebrow: `A better first page for every submission`
  - Title: `Quick Cover`
  - Description: `Create clean, professional lab report and assignment cover pages in just a few moments.`
  - Benefit Pills: `Fast & easy`, `Live document preview`, `Print-ready PDF`
  - Hero CTA: `Start Generating →`
- **Tool Page Chrome (`#editor`)**:
  - Top Navigation Actions: `← Back to Home`, `Download PDF`
  - Panel Heading: `Your Information`
  - Preview Toolbar: `LIVE PREVIEW`, `A4 · Portrait`
  - Action Button: `Update Preview`
  - Editor Microcopy Note: `Your changes appear in the document preview as you type.`
- **Footer Chrome**:
  - Fineprint: `© 2026 Quick Cover. A simpler way to prepare submissions.`
  - Footer Links: `Features`, `How it works`, `FAQ`

*(Note: Per Section C.2 §6 and D.2.a, institutional feature field labels such as University Name, Department, Course Code, Level, Term, Teachers, etc., remain our exact application labels and are not replaced by reference prototype placeholders).*
