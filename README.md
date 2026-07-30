# @todoforai/embed — "AI, do it"

Turn setup instructions into actions. Instead of asking users to configure
things by hand, hand the steps to their AI.

Every product has steps a user must do by hand to get started — create an
account, paste an API key, connect a CMS, flip a DNS record, install a tool.
You normally write these as a docs page and hope the user follows them.

Drop this button next to those steps instead. The site owner writes the task
once; a visitor clicks, and **their own AI agent at
[todofor.ai](https://todofor.ai) does the configuring for them** — running the
CLI, filling the forms, and, when the steps live elsewhere, **navigating off
your site to finish the job** (a dashboard, a provider console, their own
machine via the browser extension). The visitor watches and approves; nothing
runs without them.

So: your onboarding docs become a button. ~5KB, zero dependencies, MIT.

Live docs & demos: **https://todofor.ai/embed/**

## The standard

| | |
|---|---|
| **Invariant** | Click → the visitor's own composer, prefilled — **never auto-submitted**. Enforced at todofor.ai. |
| **Required by default** | The flame mark on the trigger — auto-injected even on custom buttons (`data-todo-no-mark` opts out). |
| **Recommended** | Label mentions AI ("AI, do it", "Fix it with AI"). |
| **Yours** | Colors, radius, font, padding, wording, or your entire own element. |


## In practice

A monitoring SaaS documents onboarding as:

> 1. Sign up at f5bot.com
> 2. Add your product keywords
> 3. Connect the Slack webhook so alerts land in your channel

Wrapped as a button, the visitor clicks once and their agent does all three —
signing up on the provider's site, entering the keywords, and wiring the
webhook — instead of the visitor tab-hopping through the steps. The task can be
written inline (`data-todo-prompt`) or saved as a reusable template you edit
later without touching your page.

## Usage (site owner)

`data-todo-prompt` is literally the setup steps, in plain language — the same
thing you'd put in a "Getting started" doc. Or point at a saved template.

```html
<!-- write the todo inline: -->
<script src="https://todofor.ai/embed/embed.js"
        data-todo-prompt="Configure my DNS records for..."
        data-todo-requirements="cli:gh,extension:chrome"></script>

<!-- or reference a registry template (editable later without touching the site): -->
<script src="https://todofor.ai/embed/embed.js" data-todo-template-id="f5bot-monitoring-setup"></script>

<!-- or explicit mount points anywhere on the page -->
<span data-todo-template-id="f5bot-monitoring-setup" data-theme="light" data-label="Set this up with AI"></span>
<span data-todo-prompt="Configure my DNS records for..."></span>
<script src="https://todofor.ai/embed/embed.js"></script>
```

Attributes (script tag or mount element): `data-todo-template-id` or `data-todo-prompt`,
`data-todo-requirements` (comma-separated, e.g. `cli:gh,extension:chrome` — inline-prompt
mode only; templates carry their own), `data-label`, `data-theme` (`dark`|`light`),
`data-target` (`_blank`|`_self`), `data-visible-when` (`always`|`logged-in`|`extension`),
`data-origin` (dev override).

Styling — fixed vs. yours: the flame mark and the click flow (prefill at
todofor.ai, never auto-submit) are the fixed contract. Everything visual is
themable via CSS custom properties (they inherit through the shadow DOM):

```css
todoforai-button { --todoai-bg: linear-gradient(135deg, #ff4500, #ff9500);
                   --todoai-color: #fff; --todoai-radius: 999px; --todoai-padding: 12px 20px;
                   --todoai-border: #444; }
```

Fully custom (headless — your element, our behavior only):

```html
<button data-todo-trigger data-todo-prompt="Configure my DNS records for...">Fix this for me</button>
```

Programmatic:

```js
const { loggedIn, extension } = await TodoForAI.status(); // 'yes' | 'no' | 'unknown'
const unmount = TodoForAI.mount(el, { template: 'f5bot-monitoring-setup', visibleWhen: 'logged-in' });
const detachFn = TodoForAI.attach(myOwnButton, { prompt: 'Configure my DNS...' }); // headless
```

## How it works

- **Click (runner A, current default)**: opens `todofor.ai/template/<id>`
  (registry) or `todofor.ai/new?prompt=<text>&requirements=...` (inline) — both
  prefill the composer and surface missing `requirements` (templates carry theirs
  in the registry). Login wall and execution are the app's job; the embed stays dumb.
- **Login detection**: hidden iframe → `todofor.ai/embed/status.html` (first-party
  cookies there) → `postMessage` back. Partitioned-storage browsers report
  `'unknown'`, never a false `'no'`. Anonymous sessions count as not logged in.
- **Extension detection**: probes `chrome-extension://<id>/icon-16x16.png`,
  which the extension exposes via `web_accessible_resources`. Chromium-only;
  elsewhere `'unknown'`.

## Architecture / the B-seam

Modules are single-purpose so runner B can slot in without touching the rest:

- `types.ts` — `Runner` interface: `run(ctx)` gets template, detection status and
  the host page (url/title).
- `detect.ts` — status probes only.
- `button.ts` — shadow-DOM view only; `--todoai-*` theming vars (no navigation/detection logic).
- `runner-redirect.ts` — runner A.
- `index.ts` — wiring + declarative auto-mount + `window.TodoForAI`.

Planned B runners (pass via `mount(el, { runner })` or a future data attribute):
- **extension runner**: hand the template to the installed extension; it registers
  the tab as a browser device and drives it (existing `debugger`/CDP machinery).
- **page-shim runner**: the page registers itself as a device over WS and exposes
  a CDP-like DOM shim, for todos that only need to act on that one page.

Which runner applies "depends on what the todo has to do" — i.e. on the
template's `requirements` (`extension:chrome`, …), which are already in the
registry schema and available in `RunContext` territory when needed.

## Build

`npm run build` → `dist/embed.js` (esbuild, IIFE, minified).

Served in production from `https://todofor.ai/embed/embed.js`.
