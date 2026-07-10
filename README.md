# Teleprompter

A local web tool to author prompts for AI coding agents. No server, no build step, no backend — open `index.html` from disk and build better prompts, faster.

## Usage

1. Open `index.html` in any browser.
2. Fill in the form (project, task, sprint, documents, MCPs, skills).
3. The right pane shows the generated prompt live. Click **Copy prompt** to copy it to the clipboard.
4. Use **Save template** / **Open template** to save and reload a form state as JSON.

## How it works

Two files:

- `index.html` — the executable: markup + inline CSS + inline JS. Open by double-click.
- `database.js` — the database: all editable prompt fragments, dropdown options, role templates, task lists. Edit this to change what the generated prompts say; never edit `index.html` for content changes.

`database.js` is loaded via `<script src>` in `<head>` (synchronous, no `fetch()`, no CORS, works on `file://`). Generation is deterministic — same inputs always produce the same prompt. No LLM, no inference.

## Documentation

- [`AGENTS.md`](AGENTS.md) — canonical technical reference (architecture, state shape, prompt assembly order, conventions).
- [`changelog.md`](changelog.md) — notable changes, newest first.

## Security

`database.js` is **executable JavaScript**, not inert data — it is loaded as a `<script>` and runs in the page. Only use a `database.js` from a source you trust. Do not accept `database.js` files or template JSON from untrusted sources. Template JSON is parsed with `JSON.parse` (no code execution), but `database.js` itself is code.

## License

See repository metadata. No third-party dependencies.
