# Architecture Standards & Guidelines for Learning Curve

1. **TypeScript & Yarn Only**:
   - Every component, model, and state manager must be written in TypeScript (`src/`).
   - Use Yarn 4 for package operations (`yarn add`, `yarn build`, `yarn typecheck`). Never run npm.
   - Run `yarn build` (`tsc`) to transpile `src/*.ts` to root JavaScript files.

2. **Component-Based Architecture**:
   - Strictly avoid inline imperative DOM building or string-stitching.
   - Use declarative component functions: `NavbarComponent`, `FooterComponent`, `PortalCardComponent`, `CalloutComponent`, `CodeBlockComponent`, `StepsComponent`, `ResourceGridComponent`, `DocViewerComponent`, `TTSButtonComponent`.
   - Mount layout components via `<div data-component="navbar">` and `<div data-component="footer">`.

3. **Mintlify Documentation Engine**:
   - Every documentation entry must feature:
     - Badges & reading time
     - Context summary callout
     - `💡 Engineering Reflection & Lessons Learned` Callout
     - Implementation Pipeline (`<Steps>`)
     - Tabbed Code Blocks with copy button
     - Authoritative Extra Resources & RFCs
     - Text-to-Speech audio reader buttons on sections
     - Pager & feedback widget

4. **Command Palette**:
   - Searchable via `⌘K` / `Ctrl+K` across docs, playbooks, and RFC references.
