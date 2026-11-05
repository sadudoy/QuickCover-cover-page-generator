# Quick Cover — Dual Reference Design Analysis

> **Update 2026-11-04**: Lab-report reference re-inspected after user correction (`lab-report-demo.pdf`, 94,520 bytes). Material changes confirmed: University header wrapped across 2 lines; Department header, Logo, Title banner, Metadata rows, Comment box, and Bottom cards shifted vertically downward by $\approx 7.58\text{ mm}$. Card and box heights remain unchanged. §1, §2, §5, and §6 updated accordingly.

---

## 1. Overview & Inspection Tooling
This document provides a measured comparative analysis of the two official reference cover page templates for the **Cover Page Generator** project:
1. **Lab Report Reference**: [`reference/lab-report-demo.pdf`](file:///d:/CSE/Projects/cover-page-generator/reference/lab-report-demo.pdf) (94,520 bytes, updated)
   - Rendered Asset: [`reference/rendered/lab-report-page-1.png`](file:///d:/CSE/Projects/cover-page-generator/reference/rendered/lab-report-page-1.png) (1655 × 2339 px, 200 DPI, 204,597 bytes)
2. **Assignment Reference**: [`reference/assignment-demo.pdf`](file:///d:/CSE/Projects/cover-page-generator/reference/assignment-demo.pdf) (92,204 bytes)
   - Rendered Asset: [`reference/rendered/assignment-page-1.png`](file:///d:/CSE/Projects/cover-page-generator/reference/rendered/assignment-page-1.png) (1655 × 2339 px, 200 DPI, 202,750 bytes)

**Tooling & Conversion Formula**:
- Inspection Engine: `PyMuPDF` (v2.1 / fitz) via `scripts/inspect-pdf.py` and `scripts/reinspect-lab.py`.
- Coordinate Conversion: Standard PostScript points to millimeters:
  $$\text{mm} = \text{points} \times \frac{25.4}{72.0} \approx \text{points} \times 0.352778$$
- Pixel to Millimeter (at 200 DPI):
  $$\text{mm} = \text{pixels} \times \frac{25.4}{200.0} = \text{pixels} \times 0.127$$

---

## 2. Reference 1: Lab Report Cover (`lab-report-demo.pdf` — Corrected Version)

### 2.1 Geometry & Canvas
- **Page Count**: 1 page.
- **Orientation**: Portrait.
- **Physical Dimensions**: $595.56\text{ pt} \times 842.04\text{ pt} \implies 210.10\text{ mm} \times 297.05\text{ mm}$.
- **Verdict**: Exact standard **ISO 216 A4** ($210\text{ mm} \times 297\text{ mm}$).
- **Global Margins**:
  - Top: $25.30\text{ mm}$ (~1.0 inch)
  - Left: $25.20\text{ mm}$ (~1.0 inch)
  - Right: $21.32\text{ mm}$ (~0.84 inch)
  - Bottom: $17.70\text{ mm}$ (cards end at $y = 279.35\text{ mm}$)

### 2.2 Element Coordinates & Extracted Content

| Element | Bounding Box $[x_0, y_0, x_1, y_1]$ (mm) | Dimensions (mm) | Extracted Content / Typography |
| :--- | :--- | :--- | :--- |
| **University Header (Line 1)** | $[37.47, 25.30, 174.04, 31.53]$ | $136.57 \times 6.23$ | `"Bangladesh Army University of Science and Technology"`<br>`TimesNewRomanPS-BoldMT`, 15.96 pt, Bold, Centered |
| **University Header (Line 2)** | $[82.74, 32.88, 128.73, 39.11]$ | $45.99 \times 6.23$ | `"(BAUST), Saidpur"`<br>`TimesNewRomanPS-BoldMT`, 15.96 pt, Bold, Centered |
| **Department Sub-header** | $[48.39, 42.63, 162.99, 48.11]$ | $114.60 \times 5.48$ | `"Department of Computer Science and Engineering (CSE)"`<br>`TimesNewRomanPSMT`, 14.04 pt, Regular, Centered |
| **Institutional Crest/Logo** | $[86.65, 57.73, 123.43, 93.71]$ | $36.78 \times 35.98$ | 318 × 312 px JPEG crest, centered horizontally ($1:1$ ratio) |
| **Title Banner** | $[84.98, 98.80, 126.66, 105.83]$ | $41.68 \times 7.03$ | `"LAB REPORT"`<br>`TimesNewRomanPS-BoldMT`, 18.00 pt, Bold, All Caps, Centered |
| **Title Underline** | $[84.98, 105.13, 125.08, 105.72]$ | $40.10 \times 0.59$ | Solid black bar rule |
| **Course Code :** | $[25.20, 120.37, 53.05, 125.05]$ | $27.85 \times 4.68$ | `"Course Code :"` (`TimesNewRomanPS-BoldMT`, 12.0 pt) |
| **Course Title :** | $[25.20, 130.10, 53.05, 134.79]$ | $27.85 \times 4.69$ | `"Course Title :"` (`TimesNewRomanPS-BoldMT`, 12.0 pt) |
| **Report no. :** | $[25.20, 139.84, 53.05, 144.53]$ | $27.85 \times 4.69$ | `"Report no. :"` (`TimesNewRomanPS-BoldMT`, 12.0 pt) |
| **Report Title :** | $[25.20, 149.58, 53.05, 154.27]$ | $27.85 \times 4.69$ | `"Report Title :"` (`TimesNewRomanPS-BoldMT`, 12.0 pt) |
| **Comment :** | $[25.20, 159.32, 53.05, 164.01]$ | $27.85 \times 4.69$ | `"Comment :"` (`TimesNewRomanPS-BoldMT`, 12.0 pt) |
| **Comment Box** | $[25.11, 168.89, 188.85, 206.37]$ | $163.74 \times 37.48$ | Rectangular closed stroke border ($1.0\text{ pt}$) |
| **"Submitted By" Card** | $[25.59, 213.23, 104.92, 279.36]$ | $79.33 \times 66.13$ | Left column box ($1.0\text{ pt}$ black border) |
| **"Submitted To" Card** | $[105.75, 213.21, 188.19, 279.34]$ | $82.44 \times 66.13$ | Right column box ($1.0\text{ pt}$ black border) |

### 2.3 Field Details in Cards
- **"Submitted By" Block**:
  - Underlined title `"Submitted By:"` at $y = 214.87\text{ mm}$ (rule at $y = 219.11\text{ mm}$).
  - Fields (all 12 pt bold, line pitch $9.74\text{ mm}$):
    - `"Name:"` ($y = 224.61\text{ mm}$)
    - `"ID:"` ($y = 234.35\text{ mm}$)
    - `"Level:"` ($x = 28.33, y = 244.08\text{ mm}$) and `"Term:"` ($x = 53.73, y = 244.08\text{ mm}$) on the same row.
    - `"Experiment Date:"` ($y = 253.82\text{ mm}$)
    - `"Submission Date:"` ($y = 263.56\text{ mm}$)
- **"Submitted To" Block**:
  - Underlined title `"Submitted To:"` at $y = 214.87\text{ mm}$ (rule at $y = 219.11\text{ mm}$).
  - Single teacher entry shown in demo:
    - `"Teacher Name:"` ($y = 224.61\text{ mm}$)
    - `"Designation:"` ($y = 234.35\text{ mm}$)
    - Vertical blank clearance: $\approx 34\text{ mm}$
    - Signature rule: `"Signature & Date: _________________"` pinned at $y = 273.30\text{ mm}$.

---

## 3. Reference 2: Assignment Cover (`assignment-demo.pdf`)

### 3.1 Geometry & Canvas
- **Page Count**: 1 page.
- **Orientation**: Portrait.
- **Physical Dimensions**: $595.56\text{ pt} \times 842.04\text{ pt} \implies 210.10\text{ mm} \times 297.05\text{ mm}$ (**ISO 216 A4**).
- **Global Margins**:
  - Top: $25.30\text{ mm}$
  - Left: $24.94\text{ mm}$ (~1.0 inch)
  - Right: $21.32\text{ mm}$ (~0.84 inch)
  - Bottom: $35.11\text{ mm}$ (~1.38 inch; cards end higher at $y = 261.95\text{ mm}$)

### 3.2 Element Coordinates & Extracted Content

| Element | Bounding Box $[x_0, y_0, x_1, y_1]$ (mm) | Dimensions (mm) | Extracted Content / Typography |
| :--- | :--- | :--- | :--- |
| **University Header (Line 1)** | $[37.47, 25.30, 174.04, 31.53]$ | $136.57 \times 6.23$ | `"Bangladesh Army University of Science and Technology"`<br>`TimesNewRomanPS-BoldMT`, 15.96 pt, Bold, Centered |
| **University Header (Line 2)** | $[82.74, 32.88, 128.73, 39.11]$ | $45.99 \times 6.23$ | `"(BAUST), Saidpur"`<br>`TimesNewRomanPS-BoldMT`, 15.96 pt, Bold, Centered |
| **Department Sub-header** | $[48.39, 42.63, 162.99, 48.11]$ | $114.60 \times 5.48$ | `"Department of Computer Science and Engineering (CSE)"`<br>`TimesNewRomanPSMT`, 14.04 pt, Regular, Centered |
| **Institutional Crest/Logo** | $[86.65, 57.73, 123.43, 93.71]$ | $36.78 \times 35.98$ | 318 × 312 px JPEG crest, centered horizontally ($1:1$ ratio) |
| **Title Banner** | $[90.06, 94.05, 121.63, 101.08]$ | $31.57 \times 7.03$ | `"Assignment"`<br>`TimesNewRomanPS-BoldMT`, 18.00 pt, Bold, Title Case, Centered |
| **Title Underline** | $[90.06, 100.39, 120.04, 100.98]$ | $29.98 \times 0.59$ | Solid black bar rule |
| **Course Code** | $[27.02, 115.63, 51.48, 120.31]$ | $24.46 \times 4.68$ | `"Course Code"` with aligned colon at $x = 61.95\text{ mm}$ |
| **Course Title** | $[27.02, 125.36, 49.46, 130.05]$ | $22.44 \times 4.69$ | `"Course Title"` with aligned colon at $x = 61.95\text{ mm}$ |
| **Assignment no.** | $[27.02, 135.10, 54.83, 139.79]$ | $27.81 \times 4.69$ | `"Assignment no."` with aligned colon at $x = 61.95\text{ mm}$ |
| **Assignment Title** | $[27.02, 144.84, 57.76, 149.53]$ | $30.74 \times 4.69$ | `"Assignment Title"` with aligned colon at $x = 61.95\text{ mm}$ |
| **Comment** | $[27.02, 154.54, 45.94, 159.22]$ | $18.92 \times 4.68$ | `"Comment"` with aligned colon at $x = 61.95\text{ mm}$ |
| **Comment Box** | $[25.11, 168.98, 188.85, 191.37]$ | $163.74 \times 22.39$ | Rectangular closed stroke border ($1.0\text{ pt}$) |
| **"Submitted By" Card** | $[24.94, 203.31, 106.11, 261.95]$ | $81.17 \times 58.64$ | Left column box ($1.0\text{ pt}$ black border) |
| **"Submitted To" Card** | $[106.62, 203.31, 189.19, 261.95]$ | $82.57 \times 58.64$ | Right column box ($1.0\text{ pt}$ black border) |

---

## 4. Specific Requirements Settled by Inspection

### 4.1 Level Rendering & Form
- In **both** documents, the label appears as `"Level:"` in 12 pt bold Times New Roman.
- It sits directly adjacent to `"Term:"` on the same horizontal baseline.
- On the exported cover page, the field value is printed immediately following the label (e.g., `"Level: 3"`).

### 4.2 Term Rendering (Roman Numerals vs Digits)
- In both documents, the template provides the label `"Term:"`.
- University practice designates terms in **Roman numerals** (`Term I` and `Term II`).
- Output renders in Roman numerals (`I` or `II`) alongside Level (e.g., `"Level: 3        Term: II"`).

---

## 5. Comparative Analysis: Lab Report vs Assignment

### 5.1 Are the designs structurally identical apart from the title?
**Answer**: **NO**, but after the correction to the lab report reference, **the two templates are even more closely aligned than before**. 
Specifically:
- **University Header**: Now **identical in both** (2 lines: `"Bangladesh Army University of Science and Technology"` + `"(BAUST), Saidpur"`).
- **Department Sub-header**: Now **identical in both** ($y = 42.63\text{ mm}$).
- **Logo Position**: Now **identical in both** ($y = 57.73\text{ mm}$ to $93.71\text{ mm}$).

The remaining **5 structural and geometric divergences** between the two templates are:
1. **Title Text & Casing**:
   - Lab Report: `"LAB REPORT"` (All Caps, 18 pt bold) at $y = 98.80\text{ mm}$, underline width $40.10\text{ mm}$.
   - Assignment: `"Assignment"` (Title Case, 18 pt bold) at $y = 94.05\text{ mm}$, underline width $29.98\text{ mm}$.
2. **Metadata Labels**:
   - Lab Report uses `"Report no."` and `"Report Title"`.
   - Assignment uses `"Assignment no."` and `"Assignment Title"`.
3. **Colon Alignment in Metadata**:
   - Lab Report has colons attached directly to label text (e.g., `"Course Code :"`).
   - Assignment uses a dedicated colon tab gutter at $x = 61.95\text{ mm}$.
4. **Student Card Fields**:
   - Lab Report includes **both** `"Experiment Date:"` and `"Submission Date:"` (5 field rows).
   - Assignment includes **only** `"Submission Date:"` (4 field rows; no experiment date).
5. **Box Dimensions**:
   - Comment Box: Lab Report is $37.48\text{ mm}$ tall (starts at $y = 168.89\text{ mm}$); Assignment is $22.39\text{ mm}$ tall (starts at $y = 168.98\text{ mm}$).
   - Bottom Cards: Lab Report cards are $66.13\text{ mm}$ tall (starts at $y = 213.22\text{ mm}$); Assignment cards are $58.64\text{ mm}$ tall (starts at $y = 203.31\text{ mm}$).

---

## 6. Architectural Recommendation: One vs Two Templates

### Recommendation: **ONE Shared Dynamic Template (Variant-Driven)**

**Re-affirmed**:
The user's correction to `lab-report-demo.pdf` further strengthens the recommendation for **ONE shared dynamic component**. The headers, department line, and logo position are now **100% harmonized** between Assignment and Lab Report covers. 

A single A4 DOM container carrying `data-cover-type="lab-report"` or `data-cover-type="assignment"` encapsulates all remaining variations via clean CSS rules without code duplication.
