# Learning Curve — Engineering Architecture Standards & Rules

This document establishes the mandatory architectural standards, development patterns, and component conventions for all future updates to the **Learning Curve** repository. Every agent and developer must strictly adhere to these rules.

---

## 1. Tooling & Language Standards
- **Language**: **TypeScript** is required for all components, data structures, state managers, and utilities.
  - Source files reside in `src/` (e.g. `src/components.ts`, `src/mintlify-components.ts`, `src/command-palette.ts`, `src/tts.ts`, `src/types.ts`).
  - Strict typing (`strict: true`, no `any`, explicit interfaces/types).
- **Package Manager**: **Yarn** (`yarn add`, `yarn build`, `yarn typecheck`). Do not use npm or pnpm.
- **Build & Transpilation**:
  - `yarn build` runs `tsc` to compile `src/*.ts` into the root JavaScript bundles (`components.js`, `mintlify-components.js`, `command-palette.js`).
  - This ensures all static HTML pages and Vercel clean URL deployments continue to load scripts seamlessly without bundling overhead.

---

## 2. Component-Based Architecture
- **Pure Composable Components**:
  - Never use imperative string stitching inside page scripts.
  - All UI elements must be pure, declarative component functions taking typed props and returning HTML strings.
  - Examples: `NavbarComponent`, `FooterComponent`, `PortalCardComponent`, `CalloutComponent`, `CodeBlockComponent`, `StepsComponent`, `ResourceGridComponent`, `DocViewerComponent`, `TTSButtonComponent`.
- **Layout Mounting**:
  - Every page uses `<div data-component="navbar" data-active="..."></div>` and `<div data-component="footer" data-subtitle="..."></div>`.
  - Auto-mounted on DOM load via `initComponentMounts()` in `components.ts`.

---

## 3. Mintlify Documentation Standards
Every documentation topic (`entriesData` in `docs.html` / `docs.ts`) must contain:
1. **Metadata Badges**: Category, reading time (`⏱️ X min read`), status (`● Production Standard`), and verification date.
2. **Context & Problem Statement**: Brief summary callout explaining what problem was being solved.
3. **Engineering Reflection & Hard-Learned Lessons (`CalloutComponent`)**:
   - `whatHappened`: Real-world scenario and what was at stake.
   - `whyItFailed`: Why the naive/initial approach failed.
   - `takeaway`: Architectural principle and lesson learned.
4. **Sequential Implementation Pipeline (`StepsComponent`)**: Numbered steps tracing the architectural workflow.
5. **Production Code Pattern (`CodeBlockComponent`)**: Multi-file tabbed code snippets with copy button feedback.
6. **Curated Authoritative Extra Resources (`ResourceGridComponent`)**:
   - High-density cards linking to official RFCs (IETF), standards (ISO, W3C), or authoritative documentation (OWASP, TanStack, Stripe).
7. **Interactive Elements**:
   - **Text-to-Speech (TTS)**: Microphone/speaker buttons allowing users to listen to sections (Overview, Reflection, Steps).
   - **Continuous Reading Pager**: Previous and Next topic buttons.
   - **Helpfulness Widget**: User feedback voting.

---

## 4. Command Palette (`⌘K` / `Ctrl+K`)
- The global `CommandPaletteComponent` must be initialized on every page.
- Catalog must be maintained with all new documentation entries, interactive playbooks, and external reference RFCs.

---

## 5. Vercel Auto-Sync & Clean URLs
- Never introduce breaking syntax or unclosed tags in HTML/CSS.
- Follow `cleanUrls: true` in `vercel.json` (e.g. `/docs`, `/specs`, `/timeline`, `/playbooks`, `/routes/*`).
- Always verify both locally and remotely after git push.
