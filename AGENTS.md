# AGENTS.md — Technical Source of Truth

> The canonical technical reference for the Teleprompter codebase. When the code and this file disagree, the correct action is to align one with the other — not to silently diverge. If you need to change a decision here, do it in a dedicated commit titled `docs(agents): <change>` with rationale in the body.

---

## 1. Architecture

Teleprompter is a **single static HTML page** (`index.html`) that loads a **data file** (`database.js`) via `<script src>`. No server, no build step, no backend, no memory. Open by double-click (`file://`) and it works.

```
 ┌────────────────────────────────────────────────────────┐
 │                index.html (executable)                 │
 │                                                        │
 │  Markup: semantic form, 23 inputs, fieldset/row hooks  │
 │  Style:  inline <style> (Paper-MCP-designed)           │
 │  Logic:  inline <script> IIFE                          │
 │    getState()       → canonical state object           │
 │    generatePrompt() → deterministic string assembly    │
 │    saveTemplate()   → JSON download (form state only)  │
 │    openTemplate()   → JSON upload + applyState()       │
 │    handleCopy()     → clipboard with fallbacks         │
 └──────────────────────────┬─────────────────────────────┘
                            │ <script src>
 ┌──────────────────────────┴─────────────────────────────┐
 │                  database.js (data)                    │
 │                                                        │
 │  const DATABASE = { ... }                              │
 │    Dropdown options, role templates, task lists,       │
 │    execution-approach variants, fixed text blocks,     │
 │    MCP phrases, audit guidance, base-doc filenames.    │
 └────────────────────────────────────────────────────────┘
```

### Key architectural decisions

1. **Two-file contract.** `index.html` is the executable (markup + inline CSS + inline JS). `database.js` is the database (all editable prompt content). The user edits `database.js` to change prompt fragments; the user never needs to touch `index.html` to change content. See §3 for the exact split.
2. **No server, no build.** Runs from `file://`. `<script src="database.js">` loads synchronously in `<head>` before the body renders. No CORS issues, no `fetch()`, no modules. This is why `database.js` is a JS file (`const DATABASE = {...}`) and not JSON — JSON would require `fetch()` + a local server.
3. **Deterministic generation.** Same inputs → same prompt, always. No LLM, no inference, no randomness. `generatePrompt(state)` is a pure function: reads `DATABASE` + state, returns a string. No side effects, no DOM access inside it.
4. **Templates capture form state only.** Export/import = JSON of the state object (`getState()`). The database is NOT bundled in the template — it stays shared/current. On import, `dbVersion` is compared and a non-blocking warning is shown if it differs, but the form still loads. Forward-compatible: unknown state keys are ignored, missing keys leave current values untouched.
5. **Single-select task toggle.** The task group (implement/plan/debug/audit) is a segmented button group, not checkboxes. Only one task active at a time. Re-clicking the active button deselects it (returns to `null`) — the toggle lives in the click handler; `selectTask(key)` itself is an absolute setter so `applyState`/import can force a specific task without toggle semantics. `selectedTask` is module-scoped state in the IIFE, not a form element value.
6. **Conditional visibility is centralized.** `refreshVisibility()` is the single function that shows/hides `#auditOptions` (based on `selectedTask === "audit"`) and `#phaseInputs` (based on `phasedExecution` checkbox). Called by `selectTask()`, the `phasedExecution` change handler, and `applyState()` (template import). No other code path toggles visibility.
7. **Paper MCP owns the visual design.** The inline CSS was authored via the Paper MCP server (Phase 3). Class hooks (`.section`, `.row`, `.label`, `#taskGroup`, `#auditOptions`, `#phaseInputs`, etc.) are the styling contract. Structural markup must not break these hooks.
8. **Caveman skill is a toggle, default on.** Reflects the user's global preference. The checkbox is checked by default in HTML (`checked` attribute) and in the canonical state (`caveman: true`). Unchecking removes the "Use caveman skill." line from the generated prompt.
9. **Context7 is an MCP entry, checked by default.** Lives in `DATABASE.mcps` like any other MCP (`{ id: "context7", ..., default: true }`), rendered as a checkbox in External connections. `default: true` on an MCP entry means `buildMcpsGroup()` checks it on load; users can still uncheck it. Rationale: AI agents trained on older data give deprecated instructions; Context7 helps avoid that, but it's now a toggle like the rest.
10. **Logo is an inline `<svg>`.** The logo is inlined directly in `index.html` as an `<svg>` element (white paths on transparent, viewBox `0 0 6428 1500`), sourced from `LogoSVG.svg`. No external image file is loaded — works with `file://` with no missing-asset 404s. CSS selector `header img, header svg` constrains it to `height: 56px; width: auto; flex-shrink: 0;`. The `LogoWhite.png` file is no longer referenced and may be deleted.

---

## 2. Tech stack

No dependencies. No `package.json`. No `node_modules`. No framework.

| Area | Technology | Version | Notes |
|---|---|---|---|
| Markup | HTML5 | — | Semantic form, `<fieldset>`, `<label for>` |
| Style | CSS (inline) | — | Vanilla, no preprocessor, no Tailwind |
| Logic | JavaScript (inline) | ES2015+ | IIFE, `"use strict"`, no modules |
| Data | `database.js` | `DATABASE.version` | `const` object, loaded via `<script src>` |
| Fonts | System + Inter | — | `'Inter', -apple-system, BlinkMacSystemFont, ...` |
| Logo | inline `<svg>` | viewBox 6428×1500 | White paths on transparent, inlined in `index.html` (sourced from `LogoSVG.svg`) |

**Runtime:** any modern browser. Open `index.html` directly. No server required.

---

## 3. File ownership: what goes where

The core contract. If you're confused about whether something belongs in `index.html` or `database.js`, ask: **"Would a user editing the database ever want to change this?"**

### `database.js` — content (the "what")

Everything a user might want to edit without touching app logic:

- Dropdown options (`projectTypes`, `stacks`)
- Task definitions (`tasks`, `auditTypes`)
- Role templates (`roleTemplates`, `techPrefix`, `rolePhrase()`)
- Prompt fragments (`blocks.executionApproach.*`, `blocks.singleDocApproach.*`, `blocks.failureProtocol`, `blocks.verificationReport`, `blocks.planConsideration`, `blocks.caveman`, `blocks.askQuestions`, `blocks.tasksHeader`)
- Task lists (`taskLists.*`)
- Audit guidance (`auditGuidance[projectType][auditType]` — 12 lists × 10–15 items, platform-specific)
- MCP phrases (`mcps[].phrase`)
- Base-doc filenames (`baseDocs[].phrase`)
- Project-type-specific approach bullets (`projectTypeApproach`)

### `index.html` — grammar (the "how")

Everything structural that should NOT change when content changes:

- Sentence templates: `"You're a " + role + ...` with conditional clause assembly (see §5)
- Section headers: `"Execution approach:"`, `"Start by reading the base documents: "`
- Formatting: `"- "` bullet prefix, `"1. "` numbering, `"\n\n"` section separation
- Fallback strings: `"none specified."`, `"Tasks: (select a task type)"`, `"to be defined"`, `"You're a developer"` (neutral role when task=null and name empty)
- All DOM structure, CSS, event wiring, state management, export/import logic, clipboard logic

### Adding entries (docs/MCPs) — database-only

Adding a base doc or an MCP requires ONLY a `database.js` entry — no `index.html` edits. All state wiring is derived from `DATABASE`:

- **Base docs:** state key = `DATABASE.baseDocs[].id` verbatim (e.g. `{ id: "roadmapDoc", label: "Roadmap", phrase: "roadmap.md" }` → state key `roadmapDoc`). `getState()`, `generatePrompt()`, `isDefaultState()`, and `applyState()` all loop over `DATABASE.baseDocs`.
- **MCPs:** state key derived by `mcpStateKey(id)` = `"mcp" + capitalize(id)` (e.g. `xcode` → `mcpXcode`); checkbox element name = `"mcp-" + id`. Same four functions loop over `DATABASE.mcps`. Convention matches the historical hardcoded keys exactly, so pre-existing templates stay compatible. An MCP entry may set `default: true` (currently only `context7`) — `buildMcpsGroup()` checks that box on load, and `isDefaultState()` compares against the entry's `default` flag instead of assuming `false`.
- Templates saved before an entry existed simply lack that key on import → current value preserved (see §6 missing-key rule). New-key entries removed from `database.js` later leave orphan keys in old templates → ignored silently (unknown-key rule).

---

## 4. State shape (canonical contract)

`getState()` returns this exact object. `generatePrompt(state)`, `saveTemplate()`, `openTemplate()`, and `applyState()` all depend on it. Do not change keys without updating all consumers.

```js
{
  projectName: "",
  projectDescription: "",
  projectType: "Next.js",      // first option in DATABASE.projectTypes
  stack: "Full stack",         // first option in DATABASE.stacks
  task: null,                  // "implement"|"plan"|"debug"|"audit"|null
  audit: { security: false, performance: false, misc: false },
  sprintObjective: "",
  phasedExecution: false,
  totalPhases: null,           // number|null
  currentPhase: null,          // number|null
  phaseSpecPath: "",           // file path string
  hasReadme: false,
  agentsDoc: false,
  scopeDoc: false,
  changelogDoc: false,
  designDoc: false,
  mcpContext7: true,            // default on
  mcpXcode: false,
  mcpPaper: false,
  mcpExpo: false,
  mcpPlaywright: false,
  caveman: true                // default on
}
```

---

## 5. Prompt assembly order

Canonical order, defined in `docs/implementation-plan/README.md` and implemented in `generatePrompt()`:

1. **Role line** — `"You're " + article(role) + " " + role + <clause> + "."` where `role` = `rolePhrase(type,stack,task)` when a task is set, else neutral `"developer"`, and the article is derived via `article()` (not hardcoded — future-proofs a vowel-initial role/techPrefix). Clause assembly: name + desc present → `" working on <name>, <descClause>"`; desc only (no name) → `" working on <descClause>"` (the description becomes the project reference); name only → `" working on <name>"`; both empty → no clause. No fabricated placeholders. `descClause` uses `normalizeDesc()`: leading "the" preserved verbatim; leading "a"/"an" stripped and re-added with the correct article (`article()` → "a"/"an" by vowel check). Project description is read through `stripTrailingDots()` at render time — user-typed trailing periods/whitespace are stripped before use, so a punctuation-only description (e.g. `"."`) becomes empty and the clause is dropped, same as an empty field.
2. **Sprint line** — `objective ? "The objective of this sprint is to: " + objective : "The objective of this sprint is to be defined"` + (if phased: `". You'll execute only phase " + current + " of " + total`) + `"."`. `objective` is `state.sprintObjective` trimmed and passed through `stripTrailingDots()` at render time; a punctuation-only objective (e.g. `"."`) becomes empty and falls back to the "to be defined" form (no colon, no double "to"). The phased clause is its own sentence (period before it, not a comma) to avoid a comma splice.
3. **Base docs line** — `"Start by reading the base documents: " + joined(checked docs + phaseSpecPath)` (or `"none specified."` if empty; skipped entirely if exactly one doc — that doc is folded into the first execution-approach bullet instead)
4. **Execution approach block** — `"Execution approach:"` header + bulleted lines from `DATABASE.blocks.executionApproach[task]` (+ `projectTypeApproach` bullet if exists for the selected project type). When `task` is null, the neutral variant `DATABASE.blocks.executionApproach.neutral` is used (not `implement`) so the approach block doesn't contradict the `"Tasks: (select a task type)"` fallback. First bullet ("Read all reference files listed above...") is dropped when zero docs, or rewritten via `DATABASE.blocks.singleDocApproach[task]` (with `{doc}` slot) when exactly one doc. `DATABASE.blocks.failureProtocol` (all tasks) and, for implement/debug, `DATABASE.blocks.verificationReport` are appended as the final bullets inside this same block — not standalone sections — so there are no floating orphan bullets in the output.
5. **Conditional blocks** — `planConsideration` (plan only, plain line) · `auditGuidance[projectType][auditType]` (audit + checked audit types — one section per checked type: header `"<Label> audit (<projectType>):"` + numbered 10–15-item list, sections joined by blank line; missing list → visible `[ERROR: ...]` line, never a throw)
6. **Skills/MCP lines** — `caveman` (if on) + checked MCP phrases (Context7 checked by default), one per line
7. **Questions line** — `DATABASE.blocks.askQuestions`
8. **Tasks** — `"Tasks:"` header + numbered list from `DATABASE.taskLists[task]`

Sections separated by `"\n\n"`. Single trailing newline. No trailing whitespace.

---

## 6. Template file format

```json
{
  "app": "teleprompter",
  "templateVersion": 1,
  "dbVersion": "1.0.0",
  "exportedAt": "2026-07-03T12:00:00.000Z",
  "name": "My template",
  "state": { ...canonical state object... }
}
```

- `app` must equal `"teleprompter"` or import is rejected.
- `templateVersion` must equal `1` or import is rejected.
- `state` must be a non-null object or import is rejected.
- `dbVersion` mismatch → warning shown, form still loads.
- Unknown state keys → ignored silently.
- Missing state keys → current value preserved.

---

## 7. Verification

There is no automated test suite. Verification is manual:

1. Open `index.html` from disk. No console errors (favicon 404 is harmless).
2. All dropdowns/checkboxes populated from `DATABASE` (not hardcoded in HTML).
3. Task toggle switches audit block visibility. Phased toggle switches phase inputs.
4. `#stateDump` (Debug section) updates live and matches the canonical state shape.
5. Generated prompt updates live in `#promptOutput` as inputs change.
6. Copy button copies the prompt to clipboard; "Copied!" feedback for 1.5s.
7. Export downloads a `.json` file; importing it restores the form exactly.
8. Import validation: tampered `app`, bad JSON, wrong `templateVersion` → error banner, form unchanged.

For deeper verification of `database.js` alone, use a scratch `test.html`:
```html
<script src="database.js"></script>
<script>console.log(DATABASE.version, DATABASE.rolePhrase('Next.js','Full stack','plan'))</script>
```
Delete the scratch file after.

Headless alternative (no browser, no scratch file): `require("./database.js")` does NOT work — no `module.exports` by design (§1.2). Use `new Function`, not `vm.runInNewContext` — top-level `const` declarations are lexical and never become properties of the vm sandbox, so `sandbox.DATABASE` is always `undefined`:
```bash
node -e 'const D=new Function(require("fs").readFileSync("./database.js","utf8")+";return DATABASE;")();console.log(D.version, D.rolePhrase("Next.js","Full stack","plan"));'
```

---

## 8. Implementation plan

> Note: `docs/*` is git-ignored — these plan files exist locally on the author's machine but are not in the repository. The code and this file are the only versioned sources of truth.

The project was built in 6 phases, documented in `docs/implementation-plan/`:

| Phase | File | Owns |
|---|---|---|
| 0 | `README.md` | Overview, input map, assembly order |
| 1 | `phase-1-database.md` | `database.js` schema + content |
| 2 | `phase-2-form.md` | `index.html` form structure + state shape |
| 3 | `phase-3-ui-paper.md` | UI design via Paper MCP |
| 4 | `phase-4-generation.md` | `generatePrompt()` logic |
| 5 | `phase-5-templates.md` | Export/import templates |
| 6 | `phase-6-polish.md` | Copy, validation, final polish |

These docs are the design spec. The code is the source of truth. If they disagree, the code wins unless the doc captures an intent the code lost — then fix the code.

---

## 9. Conventions

- **No comments removed without reason.** Existing comments explain "why" not "what." Preserve them.
- **No new dependencies.** Vanilla JS + CSS only. No npm, no framework, no library.
- **No build step.** The file you edit is the file the browser runs.
- **Edit `database.js` for content.** Edit `index.html` for structure/logic/style. See §3.
- **Keep `generatePrompt` pure.** No DOM access, no side effects. It takes state, returns a string.
- **IIFE stays.** All JS lives inside the `(function () { "use strict"; ... })()` IIFE. No globals leak.
- **Class hooks are the styling contract.** `.section`, `.row`, `.label`, `#taskGroup`, `#auditOptions`, `#phaseInputs`, `#docsGroup`, `#mcpsGroup`, `#skillsGroup`, `#promptOutput`, `#stateDump`, `#copyBtn`, `#saveBtn`, `#openBtn`, `#templateWarning`, `#emptyHint`, `#phaseHint`. Don't rename without updating CSS.
