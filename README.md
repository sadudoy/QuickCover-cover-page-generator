# Quick Cover

Quick Cover is a zero-dependency, client-side web application designed to generate standardized, print-ready university assignment and lab-report cover pages matching institutional templates exactly.

Built with vanilla HTML5, CSS3, and JavaScript ES modules — **no frameworks, no bundler, no build step, no backend**.

---

## Quick Start

### 1. Run the Development Server
Start the built-in local static server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Run Tests
Execute the automated smoke tests using Node's built-in test runner:
```bash
npm test
```

---

## Reference Templates
The application matches two official departmental templates:
- **Assignment**: [`reference/assignment-demo.pdf`](reference/assignment-demo.pdf)
- **Lab Report**: [`reference/lab-report-demo.pdf`](reference/lab-report-demo.pdf)
- **Rendered Previews**: [`reference/rendered/`](reference/rendered/)

---

## Documentation
- [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) — Product requirements, assumptions, and scope.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System architecture, template strategy, and stack decisions.
- [`docs/DESIGN_ANALYSIS.md`](docs/DESIGN_ANALYSIS.md) — Measured dual-PDF analysis and template comparison.
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — Local development and workflow instructions.
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — Current implementation milestones and roadmap.
