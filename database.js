const DATABASE = {
  version: "1.2.0",

  // Dropdown options
  projectTypes: ["Next.js", "Swift", "React Native", "Web"],
  stacks: ["Full stack", "Frontend", "Backend"],

  // Task types — multi-toggle in UI, but only one selected at a time
  tasks: {
    implement: { label: "Implement" },
    design:    { label: "Design" },
    debug:     { label: "Debug" },
    audit:     { label: "Audit" }
  },

  // Tech prefix slotted into role templates. Maps projectType -> qualifier string.
  techPrefix: {
    "Next.js":      "Next.js",
    "Swift":        "Swift/iOS",
    "React Native": "React Native",
    "Web":          "Web"
  },

  // Role composition: maps (projectType, stack, task) -> role phrase.
  // Used in: "You're a <role> working on <name>, a <desc>."
  // Structure: pick template from roleTemplates[task][stack], then replace "{tech}"
  // with techPrefix[projectType]. debug and audit are stack-agnostic (one template each).
  roleTemplates: {
    design: {
      "Full stack": "lead architect and {tech} senior developer",
      "Frontend":   "lead architect and {tech} senior frontend developer",
      "Backend":    "lead architect and {tech} senior backend developer"
    },
    implement: {
      "Full stack": "{tech} senior full-stack developer",
      "Frontend":   "{tech} senior developer and UI expert",
      "Backend":    "{tech} senior developer and backend specialist"
    },
    debug: {
      "Full stack": "{tech} senior engineer",
      "Frontend":   "{tech} senior engineer",
      "Backend":    "{tech} senior engineer"
    },
    audit: {
      "Full stack": "{tech} code reviewer",
      "Frontend":   "{tech} code reviewer",
      "Backend":    "{tech} code reviewer"
    }
  },

  rolePhrase: function (projectType, stack, task) {
    // Returns the role phrase, e.g. "lead architect and Next.js senior developer".
    // Fallbacks: unknown task -> "developer"; unknown stack -> first stack for the task;
    // unknown projectType -> "" (tech prefix dropped).
    const taskTemplates = DATABASE.roleTemplates[task];
    if (!taskTemplates) return "developer";
    const template = taskTemplates[stack] || taskTemplates["Full stack"];
    const tech = DATABASE.techPrefix[projectType] || "";
    return template.replace("{tech}", tech).replace(/\s+/g, " ").trim();
  },

  // Audit sub-options (only shown when task === audit)
  auditTypes: {
    security:   { label: "Security",   key: "security" },
    performance:{ label: "Performance",key: "performance" },
    misc:       { label: "Misc",       key: "misc" }
  },

  // Base documents — checkbox list, order matters for the "Start by reading" line.
  // All phrases are filenames (user's projects use a .md doc system).
  baseDocs: [
    { id: "hasReadme",    label: "README",      phrase: "README.md" },
    { id: "agentsDoc",    label: "Agents doc",  phrase: "AGENTS.md" },
    { id: "scopeDoc",     label: "Scope doc",   phrase: "scope.md" },
    { id: "changelogDoc", label: "Changelog",   phrase: "changelog.md" },
    { id: "designDoc",    label: "Design doc",  phrase: "design.md" }
  ],

  // MCP servers
  mcps: [
    { id: "xcode",    label: "XCodeBuildMCP MCP", phrase: "Use XCodeBuildMCP MCP if needed" },
    { id: "paper",    label: "Paper MCP",         phrase: "Use Paper MCP for any meaningful design interventions" },
    { id: "expo",     label: "Expo MCP",          phrase: "Use Expo MCP if needed" },
    { id: "playwright", label: "Playwright MCP",  phrase: "Use Playwright MCP if needed for some tests" }
  ],

  // Fixed text blocks
  blocks: {
    // Per-task execution approach. Each task gets its own variant.
    // "Inspect and update files" was implement-specific; now each task has
    // appropriate verbs (create/update for implement, investigate for debug,
    // understand for design, review for audit).
    // Each array item is rendered as a bullet ("- " prefix) in the prompt.
    executionApproach: {
      neutral: [
        "Read all reference files listed above before starting anything.",
        "Follow the phase spec exactly. Do not implement work from later phases unless the spec explicitly asks for a preparatory hook."
      ],
      implement: [
        "Read all reference files listed above before editing anything.",
        "Create or update files exactly as the phase spec requests.",
        "Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.",
        "Keep changes limited to this phase. Do not implement work from later phases unless the spec explicitly asks for a preparatory hook."
      ],
      debug: [
        "Read all reference files listed above before editing anything.",
        "Investigate the root cause before making changes. Propose the fix before applying it.",
        "Run required tests. If a test cannot run in this environment, clearly state the manual validation steps and what evidence is needed.",
        "Keep changes limited to the fix. Do not refactor unrelated code."
      ],
      design: [
        "Read all reference files listed above before designing anything.",
        "Understand the existing codebase structure, patterns, and conventions.",
        "Design context-independent phases that individual AI coding agents can execute in their own context window.",
        "Ensure each phase has its own pre-checks and testing environment."
      ],
      audit: [
        "Read all reference files listed above before reviewing anything.",
        "Review the code against the audit elements. Do not fix or modify code.",
        "Run each audit check. If a check cannot run in this environment, clearly state what manual validation is needed.",
        "Report findings per check: pass, fail, or incomplete."
      ]
    },

    // Fires for all tasks. Stops the agent from barreling through failures.
    // Rendered as a bullet.
    failureProtocol: "If any pre-check, verification, or success criterion fails, stop and ask the user how to proceed. Do not proceed with assumptions.",

    // Fires for implement + debug. Explicit verification reporting.
    // Rendered as a bullet.
    verificationReport: "Share verification results explicitly: list each check from the phase spec, whether it passed or failed, and the evidence that supports it.",

    designConsideration: "Consider you'll be developing a plan for an AI agent, so be very specific, clear, and pragmatic with your approach.",
    caveman: "Use caveman skill.",
    context7: "Use Context7 MCP if needed to be up-to-date on the latest tools used in the stack.",
    askQuestions: "Ask any questions you consider important before proceeding.",
    tasksHeader: "Tasks:",

    // Single-doc first-bullet variants. When exactly one base doc is checked,
    // the generic "Read all reference files listed above" bullet is replaced
    // with one that names the doc. {doc} is filled with the doc's phrase.
    // Verbs match each task's nature (debug = investigate, not edit).
    singleDocApproach: {
      neutral:   "Read the {doc} before starting anything.",
      implement: "Read the {doc} before editing anything.",
      debug:     "Read the {doc} before investigating anything.",
      design:    "Read the {doc} before designing anything.",
      audit:     "Read the {doc} before reviewing anything."
    }
  },

  // Project-type-specific execution-approach bullets appended after the
  // per-task approach lines. Keyed by projectType. Empty for types that
  // add no extra bullet.
  projectTypeApproach: {
    "Swift": "For any testing on the iOS Simulator, use iPhone 17 Pro."
  },

  // Task lists per task type
  taskLists: {
    implement: [
      "Ensure all pre-requisites are met",
      "Execute the plan as explained in the documentation",
      "Write a summary at the end with everything you modified, created or deleted, the performed tests, the outcomes, and any blockers or next steps"
    ],
    design: [
      "Ensure you understand the task and the context of the source code",
      "Develop an implementation plan in context-independent phases, that individual AI coding agents can perform on its own context window",
      "Ensure each phase has its own pre-checks and testing environments",
      "Include a phase 0 with a README of the important consideration for each phase, including a short description of the job, clarity on the structure, etc.",
      "Output the implementation plan on a new folder, containing independent .md files for each phase"
    ],
    debug: [
      "Ensure you understand clearly the root cause of the issue",
      "Propose the best solution to solve it",
      "With the user's approval, execute the solution",
      "Test or let the user know how to test if the solution worked"
    ],
    audit: [
      "Don't fix or execute any code, you're reviewing the code against the audit elements",
      "Try to run each audit element test by yourself, let the user know if they need to do something",
      "If one particular test is not successful, or there's no user input, mark it as incomplete",
      "Write the suggested solution to fix the elements that don't pass the audit"
    ]
  },

  // Audit-type-specific guidance appended to execution approach when task=audit
  auditGuidance: {
    security:    "Review for secrets in code, dependency vulnerabilities, input validation, auth/authz gaps.",
    performance: "Review for N+1 queries, unnecessary re-renders, blocking I/O, unbounded loops, missing caching.",
    misc:        "Review for code clarity, dead code, naming, error handling coverage, test coverage gaps."
  }
};
