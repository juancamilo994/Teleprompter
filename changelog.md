# Changelog

All notable changes to Teleprompter are logged here, newest first. Use this file to tell the next agent (or your future self) what reality looks like today.

## Format

```
## YYYY-MM-DD — <Phase X> or <Unreleased>

### Added
- Bullet per feature shipped.

### Changed
- Behavior changes (not refactors unless behavior changed).

### Fixed
- Notable bugs fixed. Focus on ones a user would feel.

### Security
- Any hardening (rare for a static client-side tool, but log it if it happens).
```

## What to log

- ✅ Feature additions
- ✅ Behavior changes (including UX or copy that affects the user experience)
- ✅ Important bug fixes
- ✅ Foundational refactors (context changes the agent must know about)
- ❌ Pure internal refactors with no behavioral impact
- ❌ Typo fixes
- ❌ Dependency bumps (there are no dependencies)

## Versioning

- `DATABASE.version` in `database.js` is the data version. Bump when prompt fragments or schema change in a way that affects generated output or template compatibility.
- No app version number — the app IS the files. Tag releases as `v<date>` on `main` if you want a snapshot.

---

## 2026-08-22 — Action verbs in task lists (db 1.7.0)

### Changed
- **Every task-list item now opens with a verb the agent can perform and know it has finished.** Four opened with "Ensure", which names a state rather than an act, and one with "Try to", which licenses giving up; two more opened with a preposition or a conditional. `Ensure all pre-requisites are met` → `Verify every pre-requisite is met, and list any that are not`; `Ensure you understand the task…` → `Read the source code and state what you understand the task to be before planning`; `Ensure you understand clearly the root cause` → `Identify the root cause and explain the evidence that points to it`; `With the user's approval, execute the solution` → `Apply the fix once the user approves it`; `Try to run each audit element test by yourself…` → `Run each audit check yourself, and tell the user which ones need their input`; `If one particular test is not successful…` → `Mark a check incomplete when it cannot run or the user's input is missing`. Source: Google's *Prompt Engineering* whitepaper (`docs/Google Prompt Engineering.pdf`, Boonstra, Feb 2025, p.55) — "try using verbs that describe the action". The audit checklists were already clean (213 items, all Verify/Confirm/Check).
- **Same fix in the plan execution approach**, so the approach block and the task list agree: `Understand the existing codebase…` → `Analyze the existing codebase…`, and `Ensure each phase has its own pre-checks…` → `Give each phase its own pre-checks…`.
- **Debug now asks for the reasoning, not just the fix.** `Propose the best solution to solve it` → `Propose the best fix, and explain what makes it better than the alternatives you considered`, following the whitepaper's debugging prompt (p.50), which asks the model to debug *and* explain how the code can be improved.

### Fixed
- Plan task 2 had a number disagreement — "individual AI coding agent**s** can perform on **its** own context window". Now "each of which an individual AI coding agent can execute in its own context window".

---

## 2026-08-22 — Privacy audit category (db 1.6.0)

### Added

- **A fourth audit type: Privacy.** `DATABASE.auditTypes` gains `privacy`, inserted between `performance` and `misc` (key order drives both checkbox order and prompt section order). `DATABASE.auditGuidance` grows from 12 lists to 16 — a new 15-item privacy list for each of Next.js, Swift, React Native, and Web. Researched from platform primary sources (Apple privacy-manifest and required-reason API docs, App Store Review Guideline 5.1.1(v), Google Play Data Safety and account-deletion policy, Expo `ios.privacyManifests` / `android.blockedPermissions`, W3C GPC, MDN on `Referrer-Policy` / `Permissions-Policy` / `Clear-Site-Data`), plus GDPR Arts. 5/7/17 and empirical scans of AI-generated apps. Provenance in `docs/audit-checklist-1.6.0/research/*.json` (local artifacts; `docs/*` is git-ignored).
- No UI, rendering, or template code was needed to surface it: `buildAuditGroup()`, the `generatePrompt()` audit block, the voice extraction schema, `validatePatch()`, and the patch applier all derive their key set from `DATABASE.auditTypes` at runtime. The fourth checkbox, the fourth prompt section, and "audit this for privacy" dictation all work off the database entry alone.

### Changed

- **`security` and `privacy` are scoped against each other, deliberately.** `security` covers attacker-driven exposure; `privacy` covers collection, consent, third-party disclosure, PII in logs/URLs/deep links, retention, and deletion. 16 candidate privacy items were rejected or reframed during research to avoid restating a `security` item — e.g. React Native `security` keeps crash-reporter *scrubbing*, so `privacy` took *consent-gating and init ordering* of the same SDKs and says nothing about scrubbing. The rule and the full adjacency table live in `docs/audit-checklist-1.6.0/README.md` §0.3 and `research/misc-dedupe.md` §4; `AGENTS.md` §3 points at them.
- **`getState()` derives the audit state shape from `DATABASE.auditTypes`** instead of a hardcoded `{ security, performance, misc }` literal. The canonical shape is now four booleans. Beyond supporting the new key, this keeps `state.audit` from going ragged if a checkbox is ever absent from the DOM — the "is default state" check iterates `Object.keys(state.audit)`.
- **`DATABASE.version` bumped `1.5.0` → `1.6.0`.** Audit prompt output changes for any audit task with Privacy checked. Templates exported at an earlier `dbVersion` still import: their `audit` object has no `privacy` key, so `setChecked()` leaves the Privacy checkbox at its current value — the documented forward-compatibility rule (§1.4: *missing keys leave current values untouched*), not a special case. No migration code needed. Note the consequence: an old template does not *clear* a Privacy box the user had already ticked, same as for any other key it omits.

### Not changed (a reviewed result, not an omission)

- **`misc` is untouched. Zero items removed.** The sprint's second job was to check whether any new privacy item duplicated something already in `misc`. All 48 `misc` items across the four platforms were given an explicit verdict: 48 of 48 are `not-privacy`. The reason is structural — the 1.3.0 sprint defined `misc` as "code clarity, dead code, error handling coverage, test coverage, accessibility, naming, project structure, lint/format discipline," a bucket that never included privacy. Where the two touch the same code they ask opposite questions: `misc` wants `console.log` stripped (build hygiene) while `privacy` governs what a legitimate log line contains; `misc` wants `window.onerror` wired so errors are captured at all while `privacy` narrows what the captured payload carries. Full verdict tables in `docs/audit-checklist-1.6.0/research/misc-dedupe.md`. The real duplication risk was with `security`, and it was handled during research rather than by deletion.

### Added (docs)

- Implementation plan: `docs/audit-checklist-1.6.0/` (README + 9 phase files + `research/` outputs), replicating the `docs/audit-checklist-1.3.0/` methodology with an added dedupe phase.

---

## 2026-08-22 — Phase-aware prompt fragments (db 1.5.0)

### Changed
- **Phase language is now conditional.** Execution-approach bullets that referenced "the phase spec" or "this phase" were emitted even when Phased execution was off, telling the agent to obey a document that did not exist. Database items may now be a `{ phased, solo }` pair, and `generatePrompt()` resolves the side matching the sprint. Affected: the neutral and implement approach bullets, and `verificationReport` ("each check from the phase spec" → "each check you ran" when unphased).
- **Plan mode disables Phased execution.** A Teleprompter plan is always authored as phases, so "you'll execute only phase 2 of 5" is not a statement a planning prompt can make. Selecting Plan greys out the toggle, hides the phase inputs, and shows a note; the checkbox keeps the user's value for when they switch back, and `getState()` reports `phasedExecution: false` for the duration.
- **Failure protocol is scoped to execution tasks** (neutral, implement, debug). It was firing on all five. Plan has nothing to execute yet, and in audit it directly cancelled the two bullets above it — "Do not fix or modify code" and "Report findings per check: pass, fail, or incomplete."
- **Failure protocol rewritten.** It read as "halt on the first failure." It now draws the real boundary: fix what is unambiguous and in scope, escalate what is a decision — "Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach."
- **Plan task list, items 4 and 5.** Item 4 read as two deliverables (a phase 0 *and* a README); it now names one file. Item 5 said "a new folder" without saying which; it now says "a new folder named after the plan objective, with one independent .md file per phase."

### Fixed
- Unphased implement prompts no longer contain the phrase "phase spec" anywhere.

---

## 2026-07-10 — Prompt polish (grammar + formatting)

### Fixed

- Empty sprint objective no longer renders "is to: to be defined" (double "to"); now "The objective of this sprint is to be defined."
- Phased-execution clause no longer a comma splice; now a separate sentence: "You'll execute only phase N of M."
- User-typed trailing periods on Project description and Sprint objective are stripped at render time — no more ".." in the prompt. Punctuation-only input treated as empty (falls back). Raw state/templates unaffected.
- Failure-protocol and verification-report bullets render inside the "Execution approach:" block instead of as floating orphan bullets.
- Role-line article derived via `article()` instead of hardcoded "a" (future-proofs vowel-initial roles; current output unchanged).

### Changed (docs)

- `AGENTS.md`: §5 assembly order updated (Tasks 1–4); §3 known deviations recorded; §8 git-ignore note added.

## 2026-07-09 — Audit checklist 1.3.0 (dbVersion 1.3.0)

### Added

- **Platform-specific audit checklists.** `DATABASE.auditGuidance` expanded from 3 platform-agnostic strings to 12 platform-specific lists of 10–15 items each (4 platforms × 3 audit types), ranked by importance. Each list researched from authoritative sources (OWASP, vendor docs, MDN, web.dev) and cited in `docs/audit-checklist-1.3.0/research/<platform>.json` (local working artifacts; `docs/*` is git-ignored). Items are imperative, platform-specific, and checkable by an AI code reviewer reading the repo. Accessibility items folded into `misc` (no separate audit type).

### Changed

- **Audit block rendering.** `generatePrompt` now emits, per checked audit type, a header line `"<Label> audit (<projectType>):"` followed by a numbered 10–15-item list (`1. ` … `N. `), matching the existing `taskLists` numbering style. Multiple checked audit types produce multiple sections separated by a blank line. A missing platform/audit-type list renders a visible `[ERROR: ...]` line instead of throwing. Replaces the previous single-bullet-per-audit-type rendering. Audit prompts are longer but more actionable.
- **Audit findings report includes file/line + severity.** `blocks.executionApproach.audit` last bullet now instructs the agent to include file/line references and a severity (high/medium/low) for each failure.
- **`taskLists.audit` deduped.** First item removed (duplicated the "review, don't fix" execution-approach bullet in the same prompt). List is now 3 items.
- **`DATABASE.version` bumped `1.2.0` → `1.3.0`.** Audit prompt output changes for any audit task with at least one checked audit type. Old templates with `dbVersion: "1.2.0"` still import (state shape unchanged) and trigger the existing mismatch warning.

### Changed (docs)

- `AGENTS.md` §3 lists `auditGuidance[projectType][auditType]` under database content; §5.6 documents the header + numbered-list rendering.
- Implementation plan: `docs/audit-checklist-1.3.0/` (README + 8 phase files + `research/` JSON outputs).

<!-- NEW ENTRIES ABOVE THIS LINE -->

## 2026-08-21 — Voice input

### Added

- **Dictation.** A microphone button in the header records a free-form description of the project and fills the form from it. Two steps, one engine each: transcription via Groq `whisper-large-v3-turbo`, extraction via Groq `openai/gpt-oss-20b` with strict constrained JSON. Requires the user's own Groq API key — free, no credit card, roughly 100 dictations a day at no cost. Without a key the mic button is disabled and links to the settings dialog; there is no fallback engine and therefore no way to get a quietly worse result. Works from `file://` with no server.
- **Correction by voice.** A second dictation patches only the fields mentioned; everything else is left alone, so "actually make it a debug task" edits one field instead of restarting.
- **Unsupported-value reporting.** Technologies Teleprompter does not model (C++, Rust, Django…) are never coerced into a supported option. The field is left untouched and the banner names what was heard.
- **Single-level undo** for the last dictation, plus a review highlight on voice-filled fields that clears when the user edits them.
- **`DATABASE.voice`** content block: model IDs, endpoints, recording limits, Whisper vocabulary hint, extraction system prompt, and all user-facing copy.
- **`?voicedebug`** query flag exposing pure voice functions on `window.__voiceDebug` for manual testing.

### Fixed

- **Mic button was unclickable in the no-key state.** `refreshMicAvailability()` set the native `disabled` attribute whenever no key was saved, which made the browser suppress all `click` events on the button — including the click handler's own "no key → open Voice settings" branch, which was correct but unreachable. Onboarding users landed on a mic button that visually explained the problem but did nothing when clicked. Fixed by driving native `disabled` off the busy (transcribing/extracting) state only; the no-key state now stays clickable and correctly opens Voice settings. Found during Phase 8 manual testing (automated pre-check, reproduced live by the owner in Safari) and fixed in the same pass.
- **Extraction could return truncated, schema-invalid JSON.** `openai/gpt-oss-20b` spends tokens on a hidden reasoning trace before the JSON; with neither `reasoning_effort` nor `max_completion_tokens` set, Groq's default completion budget could run out mid-JSON, cutting off exactly the schema's trailing properties (observed live: a dictation correction failed with a Groq 400 for missing `caveman`/`unmatched`). Fixed by setting `reasoning_effort: "low"` (this is a straightforward extraction task, not one that benefits from heavy reasoning) and a generous explicit `max_completion_tokens` on the extraction request.
- **`unmatched` could be returned as `null` instead of `[]`, another schema-validation 400.** None of the extraction prompt's rules told the model that `unmatched` (unlike every other field) is never nullable — it must always be an array. Added rule 10 to `extractionSystemPrompt` in `database.js`, mirroring the existing rule 9 pattern for `audit`/`docs`/`mcps`.
- **A schema-validation 400 wasn't retryable**, forcing the user to redo the whole dictation on what is often a transient decoding hiccup rather than a permanent failure. `errorGeneric` (covers Groq 400s, unparseable JSON, and the unknown-status catch-all) added to the `RETRYABLE` list, alongside the existing network/timeout/rate-limit cases — the capture/transcript is retained either way, so retrying is safe.
- **Voice-filled highlight could fire on a field that didn't actually change.** `applyVoicePatch` counted a field as "changed" whenever the model returned any non-null value for it, even if that value happened to already match the current state (observed live: `stack` highlighted, unprompted, with its pre-dictation value). The review highlight and the banner's field count now compare against the current state and only flag genuine differences.
- **Voice-filled highlights from an earlier dictation never cleared on a later one.** Each correction added its own highlights on top of every prior round's, instead of replacing them — so after a second dictation, the one real change from that round was easy to miss sitting among a growing pile of stale highlights from the first (observed live: after a correction, the field it actually changed appeared no different from the untouched fields still lit from the original dictation). `applyVoicePatch` now clears the previous highlight set before marking the new one; a dictation that changes nothing leaves the existing highlights alone rather than wiping them for no reason.
- **Approaching the recording limit gave no textual warning.** Past the 100s warn threshold, only the status color and level-meter fill turned amber — the status text kept reading "Listening — Ns" with no indication anything had changed, which said nothing to a screen reader and made a sighted user do the 120-minus-N math themselves. New `statusRecordingWarn` copy ("Listening — {seconds}s. Stopping in {remaining}s.") replaces the plain status text once the warn threshold is reached, matching the explicit-numbers style already used for the hard-cap notice.

### Security

- The Groq API key is stored only in the user's browser (`localStorage`), masked in the UI, verified against Groq's `/models` endpoint, and removable in one click. It is never included in exported templates, never written to the canonical state or the state dump, and never logged. Imported templates cannot inject one: `applyState` reads a fixed allowlist of known state keys and ignores everything else, and it additionally drops credential-shaped keys as a tripwire against future refactors.
- Requests carrying the key go through `voiceFetch()`, which refuses any origin outside an allowlist hardcoded in `index.html`, so the endpoints in `database.js` cannot be edited to redirect the credential.
- A key rejected with 401 is kept and flagged unverified rather than deleted, so a transient auth failure cannot silently discard something the user pasted.
- Documented residual risk, stated plainly rather than papered over: `database.js` is executable JavaScript loaded into the page, so a modified one can read `localStorage` directly regardless of the endpoint allowlist. Only load a `database.js` you trust, and use a key you can rotate. The key dialog says this and `README.md` repeats it.

### Changed (docs)

- `AGENTS.md` §1 gains four decisions (voice is optional and has no fallback engine; LLMs propose input, never generate prompts; voice works on `file://`; credentials are pinned in code, not data), plus updates to §2, §3, §4, §6, §7, and §9.

### Not changed

- `DATABASE.version` stays `1.4.0`: prompt output and template compatibility are unaffected.
- `generatePrompt()` and the canonical state shape are untouched.

A manual test guide lives at `docs/voice-input/MANUAL-TESTS.md` (not committed — `docs/` is git-ignored).

## 2026-07-03 — Audit ship-now fixes (dbVersion 1.2.0)

### Fixed

- **F1 (audit #1) — Phase null + out-of-range clause.** `generatePrompt` could emit `", you'll be executing only phase null of null."` when `phasedExecution` was on but phase fields were empty, and `", phase 5 of 3."` when `currentPhase > totalPhases`. The phase clause is now appended only when both values are positive integers and `currentPhase <= totalPhases`. Matches the UI's `updatePhaseHint` warning.
- **F2 (audit #2) — Clipboard rejection unhandled + lying feedback.** `copyToClipboard` had no `.catch` on `navigator.clipboard.writeText`, so a secure-context permission denial rejected unhandled with no fallback. `handleCopy` always showed "Copied!" regardless of the returned boolean. Extracted `fallbackExecCommand`, added `.catch` routing to it, and `handleCopy` now shows "Copied!" only on success and "Copy failed" on failure. The intrusive `alert()` fallback-2 was replaced with the existing `setWarning` banner, and `#promptOutput` is selected so Cmd/Ctrl+C still works.
- **F3 (audit #5) — `database.js` load failure = blank page.** A missing/misnamed `database.js` previously threw inside `init()` and left a blank page with only a console error. The `<script src="database.js">` tag now sets `window.__DB_FAILED=true` via `onerror`, and `init()` guards on `typeof DATABASE === "undefined" || window.__DB_FAILED`, replacing the body with a user-facing error message ("Failed to load database.js. Place it next to index.html and refresh.") before returning. (Deviation from the audit's inline-`onerror`-renders-message approach: that fails when `onerror` fires before `<body>` exists. The flag + `init` guard is robust to that timing.)
- **F4 (audit #7) — Empty hint and full default prompt both visible at init.** At default state, `#emptyHint` showed while `#promptOutput` was also populated with the full default prompt — contradictory. `render()` now hides `#promptOutput` while in the default state and shows it once the user enters non-default input. Copy still works (it reads `generatePrompt(getState())` directly, not the visible pane). Added `#promptOutput[hidden] { display: none; }` to make the hidden state explicit under the existing `flex:1` rule.
- **F5 (audit #14) — `applyState` didn't validate `projectType` / `stack`.** Importing a template with `projectType: "Vue"` or `stack: "Mobile"` silently applied the unknown value, and `rolePhrase`'s fallbacks then dropped the tech prefix with no warning. `applyState` now only sets the dropdowns when the value is a member of `DATABASE.projectTypes` / `DATABASE.stacks`; otherwise the dropdown keeps its current value. The `dbVersion` mismatch warning still fires.

### Changed

- **F6 (audit #4) — Null task shows implement execution-approach block.** With no task selected, `taskKey = state.task || "implement"` rendered implement-specific lines ("Create or update files exactly as the phase spec requests.") while the Tasks section said "(select a task type)" — contradicting. Added a neutral variant to `DATABASE.blocks.executionApproach.neutral` and `DATABASE.blocks.singleDocApproach.neutral`, and `generatePrompt` now uses `state.task || "neutral"`. The neutral first bullet reads "Read all reference files listed above before starting anything." Default-state prompt output changes; bump `DATABASE.version` `1.1.0` → `1.2.0`.

### Added

- **F7 (audit #6) — Root `README.md`.** The repo had no top-level README (only `docs/implementation-plan/README.md`). Added a root `README.md` with project description, usage, two-file architecture, links to `AGENTS.md` / `docs/implementation-plan/README.md` / `changelog.md`, and a "Security" note that `database.js` is executable JavaScript (loaded via `<script>`), not inert data — only use files from trusted sources; don't accept `database.js` or templates from untrusted sources.
- **F8 (audit #13) — `.gitignore`.** Added `.gitignore` ignoring `.playwright-mcp/` (Playwright MCP snapshot/log noise) and `.DS_Store` (macOS noise).

### Changed (docs)

- `changelog.md` renamed from `Changelog.md` (capital C) to match the lowercase references in `AGENTS.md` §8 and `DATABASE.baseDocs`. Works on case-sensitive filesystems and in markdown links. (No git repo present, so the case-insensitive-FS `git mv` temp-name dance wasn't needed; plain `mv` via a temp name applied.)
- `AGENTS.md` §3 lists `executionApproach.neutral` / `singleDocApproach.neutral` under database content; §5.4 documents the neutral fallback for the null-task case.
- `DATABASE.version` bumped `1.1.0` → `1.2.0` (null-task prompt output changes; affects generated output).

## 2026-07-03 — Post-audit fixes (dbVersion 1.1.0)

### Fixed

- **F1 — Article clash in role line.** `generatePrompt` hardcoded `"a "` before the project description, producing ungrammatical output when the description started with a vowel or already carried an article (`"a a static HTML tool"`, `"a all audit types"`). Added `article()` (a/an by vowel check) and `normalizeDesc()` (strips leading a/an, preserves leading "the"). Now: `"static HTML tool"` → `"..., a static HTML tool."`; `"an API service"` → `"..., an API service."`; `"the United States"` → `"..., the United States."`.
- **F2 — Fallback placeholders injected false context.** Empty `projectName`/`projectDescription` previously substituted `"an unnamed project"` / `"undescribed project"`, which the AI consumer could hallucinate around. Empty fields now drop their clause entirely: task set + empty name → `"You're a <role>."`; task null + empty name → `"You're a developer."`; empty desc → desc clause omitted. Agent receives a shorter prompt and asks the user instead.
- **F3 — No way to deselect a task.** Clicking a task button was a one-way set; the only path back to `null` was a page reload or template import. Re-clicking the active button now toggles to `null`. The toggle lives in the click handler — `selectTask(key)` stays an absolute setter so `applyState`/import can force a task without toggle semantics. Active button shows `title="Click again to deselect"`.
- **F4 — "Read all reference files listed above" with zero docs.** When no base docs were checked, the first execution-approach bullet still said "listed above" while pointing at "none specified". Three-state handling now: zero docs → drop the bullet; one doc → rewrite via `singleDocApproach`; 2+ docs → keep generic.

### Changed

- **F5 — `singleDocApproach` relocated to `database.js`.** The single-doc first-bullet variants were hardcoded in `index.html` (AGENTS §3 known debt). Moved to `DATABASE.blocks.singleDocApproach`. Debug verb corrected from "editing" to "investigating" to match debug's investigate-first nature (was identical to implement).

### Changed (docs)

- `AGENTS.md` §1.5 (task toggle now re-click-deselect), §3 (debt removed; `singleDocApproach` listed under database content; fallback strings updated), §5.1 (role line conditional clause assembly), §5.4 (zero-doc / single-doc first-bullet handling).
- `DATABASE.version` bumped `1.0.0` → `1.1.0` (prompt fragments + fallback behavior changed; affects generated output).



## 2026-07-03 — v1.0.0 (Initial Release)

### Added

- Teleprompter v1.0.0 — a static web tool to author prompts for AI coding agents.
- Two-file architecture: `index.html` (executable, inline CSS + JS) + `database.js` (prompt content database). Opens directly from disk via `file://`, no server or build step.
- 23-input form across 6 sections: Project, Task, Sprint, Documents, External connections, Skills. All dropdown/checkbox options populated from `DATABASE` — zero hardcoded options in markup.
- Deterministic prompt generation: `generatePrompt(state)` is a pure function following a canonical 9-step assembly order (role → sprint → docs → execution approach → failure protocol → conditional blocks → skills/MCP → questions → tasks). Same inputs always produce the same prompt.
- Role matrix: 4 project types × 3 stacks × 4 tasks, with `{tech}` slotting from `techPrefix`.
- Per-task execution approach variants (implement/create-update, debug/investigate, design/understand, audit/review) plus a failure protocol block (all tasks) and verification report block (implement + debug).
- Conditional visibility: audit sub-options appear only when task=audit; phase inputs appear only when phased execution is on. Centralized in `refreshVisibility()`.
- Template export/import: JSON envelope with `app`, `templateVersion`, `dbVersion`, `state`. Form-state only (DB stays shared/current). Forward-compatible import (unknown keys ignored, missing keys preserved, `dbVersion` mismatch shows non-blocking warning).
- Copy-to-clipboard with three-tier fallback (`navigator.clipboard` → `execCommand` → select + alert) and "Copied!" feedback.
- UI designed via Paper MCP: dark header with `LogoWhite.png`, dual-pane layout (form left, live prompt preview right), custom switch + checkboxes, responsive collapse at 720px.
- Inline validation: phase hint warns when `currentPhase > totalPhases` or either is empty.
- Implementation plan retained in `docs/implementation-plan/` (6 phase specs + README) as living design spec.
- `AGENTS.md` as canonical technical reference.
