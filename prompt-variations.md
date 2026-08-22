# Teleprompter — Prompt Variations

All prompts the app can emit, with variables replaced by `{placeholders}`.
Per request: MCPs and base-doc combinations omitted; role line shown as matrix only.

Sections separated by a blank line. Single trailing newline. Bullets use `- `.

---

## 1. Role line — matrix

`You're {article} {role}{clause}.`

- `{article}` = `a`/`an` by vowel check on `{role}` first letter.
- `{role}` = `rolePhrase(projectType, stack, task)` from the matrix below, with `{tech}` replaced by `techPrefix[projectType]` (`Next.js` → `Next.js`, `Swift` → `Swift/iOS`, `React Native` → `React Native`, `Web` → `Web`).
- When `task` is null → `{role}` = `developer` (neutral), regardless of projectType/stack.
- `{clause}` (independent of task):
  - name + desc present → ` working on {name}, {descClause}`
  - desc only (no name) → ` working on {descClause}` (description becomes the project reference)
  - name only → ` working on {name}`
  - both empty → no clause

`{descClause}` = `normalizeDesc(description)`:
- leading `the` preserved verbatim → `{description}`
- leading `a`/`an` stripped, correct article re-added → `{article} {description-without-leading-a/an}`
- otherwise → `{article} {description}`

### Role templates (`{tech}` slot filled by `techPrefix[projectType]`)

| Task        | Full stack                                  | Frontend                                       | Backend                                        |
|-------------|---------------------------------------------|------------------------------------------------|------------------------------------------------|
| plan        | lead architect and {tech} senior developer  | lead architect and {tech} senior frontend developer | lead architect and {tech} senior backend developer |
| implement   | {tech} senior full-stack developer          | {tech} senior developer and UI expert          | {tech} senior developer and backend specialist |
| debug       | {tech} senior engineer                      | {tech} senior engineer                         | {tech} senior engineer                         |
| audit       | {tech} code reviewer                        | {tech} code reviewer                           | {tech} code reviewer                           |
| (null)      | developer                                   | developer                                      | developer                                      |

Examples:
- `Next.js` + `Full stack` + `implement` → `Next.js senior full-stack developer`
- `Swift` + `Frontend` + `plan` → `lead architect and Swift/iOS senior frontend developer`
- `Web` + `Backend` + `audit` → `Web code reviewer`
- any + any + `null` → `developer`

---

## 2. Sprint line — variations

Always present, second line of the prompt.

```
The objective of this sprint is to: {sprintObjective}.
```
or, when objective empty / punctuation-only:
```
The objective of this sprint is to be defined.
```

When `phasedExecution` is on AND `0 < currentPhase ≤ totalPhases` (both integers), append as its own sentence.
**Never in plan mode** — selecting Plan disables the toggle and `getState()` reports `phasedExecution: false`, so a plan prompt has no phase clause, no phase-spec doc, and no phase-conditional bullets:
```
. You'll execute only phase {currentPhase} of {totalPhases}.
```

Final form (phased + objective):
```
The objective of this sprint is to: {sprintObjective}. You'll execute only phase {currentPhase} of {totalPhases}.
```

---

## 3. Base docs line — omitted here

With no docs checked (this file's scope): always renders as
```
Start by reading the base documents: none specified.
```
With exactly one doc checked: line is skipped entirely, first execution-approach bullet rewritten to name that doc.
With 2+ docs: `Start by reading the base documents: {doc1}, {doc2}, and {doc3}.` (Oxford comma).

When `phasedExecution` is on and `phaseSpecPath` set, that path counts as an extra doc in the list above. Plan mode never reaches this branch.

---

## 4. Execution approach block — per task

Header always `Execution approach:`. Bullets below.

First bullet (`Read all reference files listed above...`) is **dropped** when zero docs (the case in this file). With one doc it's rewritten to `Read the {doc} before {verb} anything.`; with 2+ docs kept as-is. Verbs per task: neutral=starting, implement=editing, debug=investigating, plan=planning, audit=reviewing.

`{projectTypeApproach}` bullet appended only for `Swift`:
```
- For any testing on the iOS Simulator, use iPhone 17 Pro.
```

**Phase-conditional bullets.** A database bullet may be a `{ phased, solo }` pair; `resolveModeLine()` emits the side matching `state.phasedExecution` and drops the bullet if that side is empty. Affects the neutral and implement blocks and `verificationReport`. No prompt ever says "phase spec" unless a phase spec exists.

`failureProtocol` bullet appended for the **execution tasks only** — neutral, implement, debug. Not plan (nothing to execute yet), not audit (it contradicts "Do not fix or modify code" and "Report findings per check").
`verificationReport` bullet appended for **implement** and **debug** only.

### 4.1 Task = null (neutral)

Phased:
```
Execution approach:
- Follow the phase spec exactly. Do not implement work from later phases unless the spec explicitly asks for a preparatory hook.
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
```
Not phased:
```
Execution approach:
- Stay within the sprint objective above. Do not expand the scope on your own.
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
```

### 4.2 Task = implement

Phased:
```
Execution approach:
- Create or update files exactly as the phase spec requests.
- Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.
- Keep changes limited to this phase. Do not implement work from later phases unless the spec explicitly asks for a preparatory hook.
- {projectTypeApproach bullet if Swift}
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
- Share verification results explicitly: list each check from the phase spec, whether it passed or failed, and the evidence that supports it.
```
Not phased — bullets 1 and 3 swap, and the verification bullet drops its phase-spec reference:
```
Execution approach:
- Create or update files exactly as the sprint objective requests.
- Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.
- Keep changes limited to the sprint objective. Do not implement work that was not asked for.
- {projectTypeApproach bullet if Swift}
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
- Share verification results explicitly: list each check you ran, whether it passed or failed, and the evidence that supports it.
```

### 4.3 Task = debug

```
Execution approach:
- Investigate the root cause before making changes. Propose the fix before applying it.
- Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.
- Keep changes limited to the fix. Do not refactor unrelated code.
- {projectTypeApproach bullet if Swift}
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
- {verificationReport — phased: "…each check from the phase spec…" / not phased: "…each check you ran…"}
```

### 4.4 Task = plan

Identical in both modes — plan mode forces `phasedExecution: false`, and a plan is phased by definition, so its phase wording is unconditional. No `failureProtocol` bullet.
```
Execution approach:
- Analyze the existing codebase structure, patterns, and conventions.
- Plan context-independent phases that individual AI coding agents can execute in their own context window.
- Give each phase its own pre-checks and testing environment.
- {projectTypeApproach bullet if Swift}
```

### 4.5 Task = audit

No `failureProtocol` bullet — an audit is defined by meeting failures and recording them.
```
Execution approach:
- Review the code against the audit elements. Do not fix or modify code.
- Run each audit check. If a check cannot run in this environment, clearly state what manual validation is needed.
- Report findings per check: pass, fail, or incomplete. For each failure, include file/line references and a severity (high/medium/low).
- {projectTypeApproach bullet if Swift}
```

---

## 5. Conditional consideration blocks

### 5.1 Task = plan — single plain line

```
Consider you'll be developing a plan for an AI agent, so be very specific, clear, and pragmatic with your approach.
```

### 5.2 Task = audit — one section per checked audit type

Audit types: `security`, `performance`, `privacy`, `misc`. Each checked type emits a section. Sections joined by a blank line. Missing checklist (database bug) → `[ERROR: ...]` line, never a throw.

Section shape (per checked type):
```
{Label} audit ({projectType}):
1. {item}
2. {item}
...
{10–15 items}
```

`{Label}` ∈ {Security, Performance, Privacy, Misc}. `{projectType}` ∈ {Next.js, Swift, React Native, Web}. Checklists are platform-specific (16 lists total in `DATABASE.auditGuidance`).

Example with all three audit types checked, projectType = Next.js:
```
Security audit (Next.js):
1. Verify Server Actions validate and authorize every input server-side; render-time gating (hidden buttons/routes) is not a security boundary.
2. Confirm Next.js is pinned above 12.3.5/13.5.9/14.2.25/15.2.3 to close CVE-2025-29927, the x-middleware-subrequest header authorization bypass.
... (13 items total)

Performance audit (Next.js):
1. Verify data-heavy fetches use next.tags with revalidateTag/revalidatePath instead of blanket no-store, to avoid unnecessary full re-fetches.
... (14 items total)

Misc audit (Next.js):
1. Verify all interactive elements have visible focus styles and are reachable via keyboard (Tab/Shift+Tab) alone.
... (12 items total)
```

If no audit type is checked while task = audit, this block is omitted entirely (no empty section).

---

## 6. Skills/MCP lines — MCPs omitted

With MCPs excluded, this section contains only the caveman line when `caveman` is on (default on). When `caveman` is off, the section is empty (still joined, so it contributes a blank line between neighbors).

Caveman on:
```
Use caveman skill.
```

---

## 7. Questions line

Always present, plain line:
```
Ask any questions you consider important before proceeding.
```

---

## 8. Tasks — per task

Header `Tasks:` + numbered list. When `task` is null → fallback single line.

### 8.1 Task = null

```
Tasks: (select a task type)
```

### 8.2 Task = implement

```
Tasks:
1. Verify every pre-requisite is met, and list any that are not
2. Execute the plan as explained in the documentation
3. Write a summary at the end with everything you modified, created or deleted, the performed tests, the outcomes, and any blockers or next steps
```

### 8.3 Task = plan

```
Tasks:
1. Read the source code and state what you understand the task to be before planning
2. Develop an implementation plan in context-independent phases, each of which an individual AI coding agent can execute in its own context window
3. Give each phase its own pre-checks and testing environment
4. Write phase 0 as a single README.md holding the context every later phase needs: what the job is, how the plan is structured, and what each phase covers
5. Output the implementation plan into a new folder named after the plan objective, with one independent .md file per phase
```

### 8.4 Task = debug

```
Tasks:
1. Identify the root cause and explain the evidence that points to it
2. Propose the best fix, and explain what makes it better than the alternatives you considered
3. Apply the fix once the user approves it
4. Test or let the user know how to test if the solution worked
```

### 8.5 Task = audit

```
Tasks:
1. Run each audit check yourself, and tell the user which ones need their input
2. Mark a check incomplete when it cannot run or the user's input is missing
3. Write the suggested solution to fix the elements that don't pass the audit
```

---

## 9. Full assembled prompts — per task

All sections joined by `\n\n`, single trailing `\n`. Placeholders: `{roleLine}`, `{sprintLine}`, `{cavemanLine}` (empty if caveman off), `{context7Line}` (on by default). Docs assumed none. Other MCPs omitted.

### 9.1 Task = null (no task selected), not phased

```
{roleLine}

{sprintLine}

Start by reading the base documents: none specified.

Execution approach:
- Stay within the sprint objective above. Do not expand the scope on your own.
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.

{cavemanLine}
{context7Line}

Ask any questions you consider important before proceeding.

Tasks: (select a task type)
```

### 9.1b Task = null, phased

Only the first approach bullet differs.

```
{roleLine}

{sprintLine} You'll execute only phase 1 of 3.

Start by reading the base documents: none specified.

Execution approach:
- Follow the phase spec exactly. Do not implement work from later phases unless the spec explicitly asks for a preparatory hook.
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.

{cavemanLine}
{context7Line}

Ask any questions you consider important before proceeding.

Tasks: (select a task type)
```

### 9.2 Task = implement, not phased

```
{roleLine}

{sprintLine}

Start by reading the base documents: none specified.

Execution approach:
- Create or update files exactly as the sprint objective requests.
- Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.
- Keep changes limited to the sprint objective. Do not implement work that was not asked for.
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
- Share verification results explicitly: list each check you ran, whether it passed or failed, and the evidence that supports it.

{cavemanLine}
{context7Line}

Ask any questions you consider important before proceeding.

Tasks:
1. Verify every pre-requisite is met, and list any that are not
2. Execute the plan as explained in the documentation
3. Write a summary at the end with everything you modified, created or deleted, the performed tests, the outcomes, and any blockers or next steps
```

### 9.2b Task = implement, phased

```
{roleLine}

{sprintLine} You'll execute only phase 1 of 3.

Start by reading the base documents: none specified.

Execution approach:
- Create or update files exactly as the phase spec requests.
- Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.
- Keep changes limited to this phase. Do not implement work from later phases unless the spec explicitly asks for a preparatory hook.
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
- Share verification results explicitly: list each check from the phase spec, whether it passed or failed, and the evidence that supports it.

{cavemanLine}
{context7Line}

Ask any questions you consider important before proceeding.

Tasks:
1. Verify every pre-requisite is met, and list any that are not
2. Execute the plan as explained in the documentation
3. Write a summary at the end with everything you modified, created or deleted, the performed tests, the outcomes, and any blockers or next steps
```

### 9.3 Task = plan

Plan mode forces `phasedExecution: false`, so this is the only plan output.

```
{roleLine}

{sprintLine}

Start by reading the base documents: none specified.

Execution approach:
- Analyze the existing codebase structure, patterns, and conventions.
- Plan context-independent phases that individual AI coding agents can execute in their own context window.
- Give each phase its own pre-checks and testing environment.

Consider you'll be developing a plan for an AI agent, so be very specific, clear, and pragmatic with your approach.

{cavemanLine}
{context7Line}

Ask any questions you consider important before proceeding.

Tasks:
1. Read the source code and state what you understand the task to be before planning
2. Develop an implementation plan in context-independent phases, each of which an individual AI coding agent can execute in its own context window
3. Give each phase its own pre-checks and testing environment
4. Write phase 0 as a single README.md holding the context every later phase needs: what the job is, how the plan is structured, and what each phase covers
5. Output the implementation plan into a new folder named after the plan objective, with one independent .md file per phase
```

### 9.4 Task = debug, not phased

Phased differs only in the final bullet: "each check from the phase spec" instead of "each check you ran".

```
{roleLine}

{sprintLine}

Start by reading the base documents: none specified.

Execution approach:
- Investigate the root cause before making changes. Propose the fix before applying it.
- Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.
- Keep changes limited to the fix. Do not refactor unrelated code.
- If a pre-check, verification, or success criterion fails, fix it when the fix is unambiguous and within scope. Stop and ask the user when you cannot fix it, or when two or more viable fixes would change the agreed approach — do not pick one by assumption.
- Share verification results explicitly: list each check you ran, whether it passed or failed, and the evidence that supports it.

{cavemanLine}
{context7Line}

Ask any questions you consider important before proceeding.

Tasks:
1. Identify the root cause and explain the evidence that points to it
2. Propose the best fix, and explain what makes it better than the alternatives you considered
3. Apply the fix once the user approves it
4. Test or let the user know how to test if the solution worked
```

### 9.5 Task = audit

`{auditSections}` — one per checked audit type, joined by a blank line; omitted entirely if none checked — is inserted after the approach block.

```
{roleLine}

{sprintLine}

Start by reading the base documents: none specified.

Execution approach:
- Review the code against the audit elements. Do not fix or modify code.
- Run each audit check. If a check cannot run in this environment, clearly state what manual validation is needed.
- Report findings per check: pass, fail, or incomplete. For each failure, include file/line references and a severity (high/medium/low).

{cavemanLine}
{context7Line}

Ask any questions you consider important before proceeding.

Tasks:
1. Run each audit check yourself, and tell the user which ones need their input
2. Mark a check incomplete when it cannot run or the user's input is missing
3. Write the suggested solution to fix the elements that don't pass the audit
```

---

## 10. Variation summary matrix

| Task      | Execution approach set | failureProtocol | verificationReport | Phase-conditional bullets | planConsideration | audit sections | Tasks list |
|-----------|------------------------|-----------------|--------------------|---------------------------|-------------------|----------------|------------|
| null      | neutral                | yes             | no                 | 1 (the scope bullet)        | no  | no  | fallback line |
| implement | implement              | yes             | yes                | 3 (bullets 1, 3, report)    | no  | no  | implement list |
| plan      | plan                   | **no**          | no                 | none — plan forces unphased | yes | no  | plan list |
| debug     | debug                  | yes             | yes                | 1 (the report bullet)       | no  | no  | debug list |
| audit     | audit                  | **no**          | no                 | none                        | no  | if audit type checked | audit list |

Independent toggles affecting every task:
- `caveman` on/off → caveman line present/absent
- `phasedExecution` on/off (+ valid phase numbers) → sprint line phase clause **and** every `{ phased, solo }` bullet. **Disabled while task = plan.**
- `sprintObjective` empty/non-empty → sprint line form
- `projectName`/`projectDescription` empty/non-empty → role line clause
- `projectType` = Swift → extra approach bullet (all tasks)
- `projectType` ∈ {Next.js, Swift, React Native, Web} → audit checklist content (audit task only)
