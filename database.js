const DATABASE = {
  version: "1.4.0",

  // Dropdown options
  projectTypes: ["Next.js", "Swift", "React Native", "Web"],
  stacks: ["Full stack", "Frontend", "Backend"],

  // Task types — multi-toggle in UI, but only one selected at a time
  tasks: {
    plan:      { label: "Plan" },
    implement: { label: "Implement" },
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
    plan: {
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

  // MCP servers. "default: true" = checked by default (currently only Context7).
  mcps: [
    { id: "context7", label: "Context7 MCP",      phrase: "Use Context7 MCP if needed to be up-to-date on the latest tools used in the stack.", default: true },
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
    // understand for plan, review for audit).
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
      plan: [
        "Read all reference files listed above before planning anything.",
        "Understand the existing codebase structure, patterns, and conventions.",
        "Plan context-independent phases that individual AI coding agents can execute in their own context window.",
        "Ensure each phase has its own pre-checks and testing environment."
      ],
      audit: [
        "Read all reference files listed above before reviewing anything.",
        "Review the code against the audit elements. Do not fix or modify code.",
        "Run each audit check. If a check cannot run in this environment, clearly state what manual validation is needed.",
        "Report findings per check: pass, fail, or incomplete. For each failure, include file/line references and a severity (high/medium/low)."
      ]
    },

    // Fires for all tasks. Stops the agent from barreling through failures.
    // Rendered as a bullet inside the Execution approach block.
    failureProtocol: "If any pre-check, verification, or success criterion fails, stop and ask the user how to proceed. Do not proceed with assumptions.",

    // Fires for implement + debug. Explicit verification reporting.
    // Rendered as a bullet inside the Execution approach block.
    verificationReport: "Share verification results explicitly: list each check from the phase spec, whether it passed or failed, and the evidence that supports it.",

    planConsideration: "Consider you'll be developing a plan for an AI agent, so be very specific, clear, and pragmatic with your approach.",
    caveman: "Use caveman skill.",
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
      plan:      "Read the {doc} before planning anything.",
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
    plan: [
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
      "Try to run each audit element test by yourself, let the user know if they need to do something",
      "If one particular test is not successful, or there's no user input, mark it as incomplete",
      "Write the suggested solution to fix the elements that don't pass the audit"
    ]
  },

  // Audit-type-specific guidance, per platform. Each list is 10–15 items,
  // ranked by importance (most important first).
  // Keyed: auditGuidance[projectType][auditType] = string[10–15].
  // Rendered as a header + numbered list per checked audit type (see index.html generatePrompt).
  auditGuidance: {
    "Next.js": {
      security: [
        "Verify Server Actions validate and authorize every input server-side; render-time gating (hidden buttons/routes) is not a security boundary.",
        "Confirm Next.js is pinned above 12.3.5/13.5.9/14.2.25/15.2.3 to close CVE-2025-29927, the x-middleware-subrequest header authorization bypass.",
        "Verify middleware re-checks auth on the actual route handler/page, not only in middleware, so a bypassed middleware can't grant access.",
        "Check next.config.js sets a Content-Security-Policy header (script-src/style-src/frame-ancestors) via headers(), not left to browser defaults.",
        "Verify next.config.js sets Strict-Transport-Security with a long max-age and includeSubDomains for all responses.",
        "Confirm experimental.serverActions.allowedOrigins is set in next.config.js to restrict which origins may invoke Server Actions and mitigate CSRF.",
        "Verify Server Actions and Route Handlers never return raw database records; shape return values to only what the UI needs.",
        "Check that secrets (API keys, DB URLs) are only read via server-only env vars (no NEXT_PUBLIC_ prefix) and never passed as props to Client Components.",
        "Verify Server Components fetching sensitive data don't leak it into the serialized payload sent to Client Component children.",
        "Confirm dynamic route segments and searchParams used in queries are validated/escaped, not interpolated directly into DB or shell commands.",
        "Verify API routes and Server Actions enforce per-request body size limits and reject oversized payloads (default 1MB for Server Actions).",
        "Check middleware matcher config doesn't accidentally exclude protected paths, leaving them reachable without the auth check running.",
        "Verify third-party and native npm dependencies are audited (npm audit / Snyk) for known CVEs, especially next itself and auth libraries.",
        "Confirm image remotePatterns in next.config.js is scoped to specific trusted hostnames, not a wildcard, to prevent SSRF via the image optimizer.",
      ],
      performance: [
        "Verify data-heavy fetches use next.tags with revalidateTag/revalidatePath instead of blanket no-store, to avoid unnecessary full re-fetches.",
        "Check fetchCache/dynamic exports aren't set to force-dynamic on pages that could be statically rendered or cached, hurting TTFB.",
        "Verify next/image is used for all raster images (not raw <img>) so automatic format/size optimization and lazy loading apply.",
        "Confirm next/font is used for custom/Google fonts with subsets specified, avoiding render-blocking font requests and layout shift.",
        "Check large Client Components are code-split with next/dynamic and heavy libraries are deferred/lazy-loaded to cut initial JS bundle size.",
        "Verify Server Components are used by default and 'use client' is only added where interactivity is actually needed, to shrink client bundle.",
        "Check bundle size hasn't regressed using @next/bundle-analyzer; flag any single chunk that grew disproportionately.",
        "Verify hydration mismatches (console warnings) are resolved, not suppressed, since they force a full client re-render of the affected tree.",
        "Confirm Suspense boundaries wrap slow/streamed data fetches so fast content isn't blocked behind slow ones.",
        "Check Core Web Vitals (LCP, INP, CLS) are monitored via useReportWebVitals or Vercel Analytics, not just measured once locally.",
        "Verify images have explicit width/height (or fill with sized parent) to prevent layout shift contributing to CLS.",
        "Check route segments that don't need per-request data use static rendering/ISR instead of forcing dynamic = 'force-dynamic'.",
        "Verify edge runtime is used for latency-sensitive, lightweight routes and node runtime is reserved for routes needing Node APIs.",
        "Confirm third-party scripts are loaded with next/script and an appropriate strategy (lazyOnload/afterInteractive) instead of a raw <script> tag.",
      ],
      misc: [
        "Verify all interactive elements have visible focus styles and are reachable via keyboard (Tab/Shift+Tab) alone.",
        "Check eslint-config-next's core-web-vitals ruleset (bundling eslint-plugin-jsx-a11y) is enabled and its warnings aren't ignored.",
        "Verify all next/image and <img> usages include a meaningful alt attribute, or alt=\"\" only when purely decorative.",
        "Confirm colour contrast on text and interactive components meets WCAG AA (4.5:1 normal text, 3:1 large text).",
        "Check error boundaries (error.tsx) and not-found.tsx exist for route segments so failures render a recoverable UI, not a blank crash.",
        "Verify loading.tsx/Suspense fallbacks are present for slow data-fetching routes instead of a blank screen during streaming.",
        "Check for dead code: unused Server Actions, exports, and components left after refactors (use next lint / knip).",
        "Verify project structure follows a consistent convention (e.g. co-located route folders, shared lib/ for utilities) rather than mixed ad-hoc layout.",
        "Confirm naming is consistent for route handlers, Server Actions, and Server/Client Component files (no ambiguous default exports across many files).",
        "Check console.log/debugger statements and commented-out code blocks are removed from production code paths.",
        "Verify TypeScript strict mode is enabled and no unchecked 'any' escapes are used to silence type errors on request/response shapes.",
        "Confirm there is test coverage (unit or e2e) for critical Server Actions and API routes, not only for UI components.",
      ],
    },
    "Swift": {
      security: [
        "Verify secrets are stored in Keychain with kSecAttrAccessibleWhenUnlockedThisDeviceOnly, never in UserDefaults or hardcoded in Info.plist.",
        "Verify no ATS exceptions weaken TLS: no NSExceptionMinimumTLSVersion below 1.2, no NSExceptionRequiresForwardSecrecy set to false in Info.plist.",
        "Verify certificate/public-key pinning is implemented for sensitive endpoints via URLSession's challenge delegate, not left to default trust evaluation.",
        "Verify custom URLAuthenticationChallenge handlers call SecTrustEvaluateWithError and don't unconditionally accept all server credentials.",
        "Verify sensitive files are excluded from iCloud/iTunes backups via NSURLIsExcludedFromBackupKey, or kept only in Keychain as ThisDeviceOnly.",
        "Verify UIPasteboard.general is never used for sensitive data (passwords, tokens) and that copy actions on sensitive fields are restricted or auto-expiring.",
        "Verify sensitive screens set a blank/redacted overlay before backgrounding to prevent the app-switcher snapshot exposing sensitive content.",
        "Verify custom URL schemes and Universal Links validate and sanitize all incoming parameters before acting on them, to prevent IPC/URL-scheme hijacking.",
        "Verify Codable decoding of untrusted JSON validates field types/ranges explicitly rather than trusting decoded values for security-relevant decisions.",
        "Verify jailbreak/tamper checks (suspicious file paths, sandbox escape APIs) exist for high-value data, with server-side revalidation as the primary control.",
        "Verify third-party SDKs are vetted for excessive entitlements/network calls and pinned to specific versions via Swift Package Manager or CocoaPods lockfiles.",
        "Verify biometric-gated Keychain items use kSecAccessControlBiometryCurrentSet so re-enrolling Face ID/Touch ID invalidates the stored item.",
        "Verify Secure Enclave (SecKeyCreateRandomKey with kSecAttrTokenIDSecureEnclave) is used for high-value cryptographic keys instead of software-only key storage.",
      ],
      performance: [
        "Verify expensive computation never runs directly inside a SwiftUI View's body; move it off the main thread or cache results, since body reruns often.",
        "Verify non-diffable stored properties (closures, reference types compared by identity) aren't causing entire views to skip SwiftUI's diffing and re-render.",
        "Verify Self._printChanges() or Instruments' View Body/View Properties tracks were used to confirm no view re-evaluates on unrelated state changes.",
        "Verify @ObservedObject/@StateObject scope is narrow, or adopt @Observable, so views only update when a property they actually read changes.",
        "Verify no retain cycles from closures capturing self strongly in escaping contexts (completion handlers, Combine sinks, Timer callbacks) without [weak self].",
        "Verify GCD/Task queues aren't starved by long-running sync work on shared concurrent queues; offload heavy work to Task.detached or a dedicated queue.",
        "Verify large-asset image decoding happens off the main thread via downsampling (CGImageSourceCreateThumbnailAtIndex) rather than full-resolution UIImage.",
        "Verify Core Data fetch requests use fetchLimit, batching, and predicates instead of loading full result sets and materializing faults for unused properties.",
        "Verify large value-type structs (arrays, dictionaries in SwiftUI models) aren't copied on every view update; prefer reference types for hot paths.",
        "Verify animations avoid triggering layout thrash by animating transforms/opacity rather than properties that force AutoLayout or SwiftUI layout passes.",
        "Verify List/ScrollView content uses lazy containers (LazyVStack, List) rather than eagerly instantiating all rows, especially for long or dynamic collections.",
        "Verify Instruments Time Profiler / SwiftUI template shows no view body exceeding a few milliseconds on the main thread during scroll or interaction.",
      ],
      misc: [
        "Verify the app follows a coherent, consistently-applied architecture (MVVM/VIPER/etc.) rather than mixing patterns ad hoc across features.",
        "Verify force unwraps (!) and force try (try!) are absent from production code paths handling external input, network responses, or user data.",
        "Verify error-handling coverage: every throwing call site either handles the error meaningfully or explicitly documents why it's safe to ignore.",
        "Verify unused/dead code (unreferenced types, commented-out blocks, unreachable branches) is removed rather than left to accumulate.",
        "Verify every interactive SwiftUI view (icon buttons, custom controls) has an accessibilityLabel and, where the action isn't obvious, an accessibilityHint.",
        "Verify text scales correctly under Dynamic Type accessibility sizes (isAccessibilitySize) without truncation or broken layout.",
        "Verify VoiceOver navigation order matches visual reading order, using accessibilitySortPriority or explicit grouping where the default order is wrong.",
        "Verify SwiftLint runs in CI with a checked-in .swiftlint.yml, and no disabled_rules bypass style violations wholesale.",
        "Verify deprecated APIs flagged by the compiler (e.g. legacy UIGraphics image context functions) are replaced with current equivalents (UIGraphicsImageRenderer).",
        "Verify automated test coverage exists for view models and business logic, not only for UI smoke tests.",
        "Verify file and type organization groups code by feature rather than by layer alone, so related logic isn't scattered across distant directories.",
        "Verify naming follows Swift API Design Guidelines (clear, non-abbreviated argument labels; verbs for mutating methods, nouns for non-mutating).",
      ],
    },
    "React Native": {
      security: [
        "Verify auth tokens use `expo-secure-store` (Keychain/Keystore-backed) or react-native-keychain, never `AsyncStorage` in plaintext.",
        "Verify Android deep links declare `android:autoVerify=\"true\"` with a hosted Digital Asset Links file; iOS prefers Universal Links over custom schemes.",
        "Verify deep-link and `Linking.addEventListener` handlers validate/sanitize the incoming URL and params before navigation or data use.",
        "Verify network calls use TLS certificate or public-key pinning (e.g. react-native-ssl-pinning, TrustKit) with a backup pin, not bare HTTPS.",
        "Verify no hardcoded API keys, tokens, or secrets exist in JS source; the bundle ships as readable/decompilable JS or Hermes bytecode on-device.",
        "Verify Hermes bytecode compilation is enabled in release builds and source maps are excluded from the shipped bundle/app store artifact.",
        "Verify `WebView` sets `javascriptEnabled` only when required, restricts `originWhitelist`, and disables `allowFileAccess`/`allowUniversalAccessFromFileURLs`.",
        "Verify third-party native modules and JS dependencies are vetted (supply-chain risk); pin versions and audit `node_modules` for known CVEs.",
        "Verify sensitive fields (PII, tokens) are excluded from crash/analytics reporter payloads (e.g. Sentry, Crashlytics) via scrubbing/redaction config.",
        "Verify Android `AndroidManifest.xml` intent filters and exported components/activities are not unintentionally exported to other apps.",
        "Verify random values for tokens, nonces, or IDs use a CSPRNG (`expo-crypto`, `react-native-get-random-values`) rather than `Math.random()`.",
        "Verify biometric/passcode gating (`expo-local-authentication` / Face ID / fingerprint) protects sensitive screens beyond just the login screen.",
        "Verify production builds disable remote JS debugging and Metro dev server access, and `__DEV__`-only debug endpoints are stripped.",
      ],
      performance: [
        "Verify large or dynamic lists use `FlatList`/`FlashList` with a stable `keyExtractor` and memoized `renderItem` (via `useCallback`/`React.memo`).",
        "Verify `FlatList` specifies `getItemLayout` when item size is known, or migrates to `FlashList v2`, which removes the need for size estimates.",
        "Verify heterogeneous lists pass `getItemType` (FlashList) so recycling groups items by shape instead of treating every row as unique.",
        "Verify Hermes is active in release builds (`global.HermesInternal`) and ships the precompiled `.hbc` bytecode bundle for faster TTI and lower memory.",
        "Verify components subscribing to Context or global stores (Redux/Zustand) select narrow slices to avoid re-render storms on unrelated changes.",
        "Verify animations use Reanimated shared values/worklets or `Animated` with `useNativeDriver: true` so they run off the JS thread, not the bridge.",
        "Verify heavy Reanimated worklet workloads (e.g. hundreds of animated views) are profiled, since worklet-per-item animation can regress below 45fps.",
        "Verify images are sized/resized appropriately and cached (`expo-image` or `react-native-fast-image`) instead of decoding full-res assets every render.",
        "Verify New Architecture (Fabric + TurboModules + JSI) migration status is tracked; RN 0.76+ defaults to it and 0.82+ removes the old bridge.",
        "Verify third-party native modules used are New-Architecture-compatible (TurboModules/Fabric), since bridge-only modules add interop overhead.",
        "Verify bundle size is monitored (`npx react-native-bundle-visualizer` or Metro analyzer) and unused libraries/polyfills are removed.",
        "Verify splash-to-first-paint time is measured and heavy synchronous work (large JSON parse, sync storage reads) is deferred off app startup.",
        "Verify list/screen benchmarking runs in release mode (`useBenchmark`/`useFlatListBenchmark`), not dev mode, since dev overhead skews results.",
      ],
      misc: [
        "Verify folder structure separates navigation, screens, components, and services coherently, and the navigation graph has no orphaned routes.",
        "Verify every `TouchableOpacity`/`Pressable`/`Touchable*` element has a valid `accessibilityRole` and a descriptive `accessibilityLabel`.",
        "Verify `accessibilityLabel` pairs with `accessibilityHint` when the action isn't obvious, and touch targets meet the 44x44pt minimum.",
        "Verify `eslint-plugin-react-native-a11y` (or equivalent) is configured and its rules (`has-valid-accessibility-role`, `no-nested-touchables`) pass.",
        "Verify ESLint runs with the React Native community config (`@react-native/eslint-config` or `eslint-plugin-react-native`) and CI fails on errors.",
        "Verify error boundaries wrap top-level navigators/screens so a single component crash doesn't blank the whole app, and errors are logged.",
        "Verify async flows (fetch, SecureStore, native module calls) have explicit try/catch or `.catch` handling instead of unhandled rejections.",
        "Verify test coverage exists for critical business logic and components using Jest + `@testing-library/react-native`, not just snapshot tests.",
        "Verify deprecated or soon-removed APIs (old-architecture-only bridge APIs, legacy `NativeModules` patterns) are flagged and tracked for migration.",
        "Verify dependencies are periodically audited for dead/unused packages (`depcheck` or `npx expo install --check`) and removed.",
        "Verify naming conventions for files, components, and hooks are consistent (e.g. `PascalCase` components, `useX` hooks) across the codebase.",
        "Verify Expo SDK version and React Native version are compatible and not multiple major versions behind current, to avoid lost security patches.",
      ],
    },
    "Web": {
      security: [
        "Verify no innerHTML/outerHTML/document.write assignment uses unsanitized user input; use textContent or a vetted sanitizer (e.g. DOMPurify).",
        "Confirm a strict Content-Security-Policy is set (script-src with nonce/hash + strict-dynamic) with no unsafe-inline and no unsafe-eval.",
        "Check the CSP includes frame-ancestors 'none' or 'self' (or X-Frame-Options) to prevent clickjacking via iframe embedding.",
        "Verify all third-party <script>/<link> tags from a CDN carry an integrity (SRI) hash and crossorigin attribute.",
        "Check eval(), new Function(), and setTimeout/setInterval with a string argument are not used with any user- or network-derived data.",
        "Verify window.addEventListener('message', ...) handlers validate event.origin against an allowlist before trusting event.data.",
        "Confirm cookies that carry session/auth state set Secure, HttpOnly, and SameSite=Strict or Lax.",
        "Check fetch()/XMLHttpRequest calls set an explicit credentials mode ('omit' or 'same-origin') rather than relying on default cross-origin behavior.",
        "Verify redirect targets built from user input (query params, hash) are validated against an allowlist to prevent open redirects.",
        "Confirm object/array merges and JSON.parse results from untrusted input never flow into Object.assign/spread onto __proto__ or prototype chains.",
        "Check no API keys, tokens, or secrets are embedded in client-side JS, HTML comments, or source maps shipped to the browser.",
        "Verify forms and state-changing fetch/XHR requests include a CSRF token or rely on SameSite cookies plus origin/referer checks server-side.",
        "Check anchor tags using target=\"_blank\" to external origins include rel=\"noopener noreferrer\" to prevent reverse tab-nabbing.",
        "Verify localStorage/sessionStorage never store auth tokens or PII in plaintext, since any XSS grants full read access to them.",
      ],
      performance: [
        "Verify <script> tags are loaded with defer (or type=\"module\") so parsing and rendering aren't blocked while scripts download.",
        "Check critical CSS is inlined or preloaded and non-critical stylesheets use rel=\"preload\" with an onload swap to avoid render-blocking.",
        "Confirm every <img>/<video> has explicit width/height (or aspect-ratio in CSS) so the layout doesn't shift once the asset loads (CLS).",
        "Verify below-the-fold images use loading=\"lazy\" and the LCP image instead uses fetchpriority=\"high\" and is not lazy-loaded.",
        "Check images are served in modern formats (WebP/AVIF) and responsively sized via srcset/sizes rather than one oversized master file.",
        "Verify @font-face declarations set font-display: swap (or optional) so custom fonts don't block text rendering (FOIT).",
        "Confirm <link rel=\"preconnect\"> or dns-prefetch hints are added for critical third-party origins (fonts, analytics, CDNs).",
        "Check long-running synchronous JS work is chunked with requestIdleCallback/setTimeout or moved to a Web Worker so it doesn't block INP.",
        "Verify event listeners added dynamically (scroll, resize, mousemove) are removed on cleanup to prevent memory leaks from accumulating.",
        "Check layout-triggering properties (offsetHeight, getBoundingClientRect) aren't read and written in the same loop, causing forced synchronous layout thrash.",
        "Verify large JS bundles are code-split by route/feature and non-critical modules are dynamically imported rather than loaded eagerly.",
        "Confirm static assets (JS, CSS, images, fonts) are served with long-lived cache-control headers and content-hashed filenames.",
      ],
      misc: [
        "Verify the page uses semantic landmarks (header, nav, main, footer) and a single logical heading order (h1 then nested h2/h3) rather than div soup.",
        "Check every form control has a programmatically associated <label> (for/id or wrapping) and every interactive element is keyboard reachable in DOM order.",
        "Verify all functionality operable via keyboard alone (Tab/Shift+Tab/Enter/Space/arrows) with no keyboard trap in modals, menus, or widgets.",
        "Check every focusable element has a visible focus indicator that isn't fully hidden behind sticky headers or overlays (WCAG 2.4.7 / 2.4.11).",
        "Verify custom widgets (dropdowns, tabs, modals) expose correct ARIA role/state/value and update aria-expanded/aria-selected on interaction.",
        "Confirm text and interactive-component color contrast meets WCAG AA (4.5:1 normal text, 3:1 large text/UI components).",
        "Check interactive touch targets are at least 24x24 CSS pixels (WCAG 2.5.8) with adequate spacing between adjacent controls.",
        "Verify status messages (form errors, save confirmations) are announced via aria-live or role=\"status\" without requiring focus to move.",
        "Check window.onerror and window.addEventListener('unhandledrejection', ...) are wired so uncaught errors are captured, not silently swallowed.",
        "Verify there is no dead CSS/JS left after refactors (unused selectors, unreferenced functions/files) and no commented-out code blocks.",
        "Confirm console.log/debugger statements are stripped from production builds or gated behind an explicit debug flag.",
        "Check there is automated test coverage (unit or e2e) for critical interactive flows, not only manual/visual verification.",
      ],
    },
  }
};
