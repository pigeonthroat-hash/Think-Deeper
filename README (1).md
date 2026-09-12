<div align="center">

<!--
  APP ICON
  Drop your square icon here (512×512 PNG recommended).
  Suggested path: docs/brand/icon.png
-->
<img src="docs/brand/icon.png" alt="Think Deeper icon" width="120" height="120">

# Think Deeper

**An agentic workspace that gives ordinary models time, tools, and self-correction.**

[Live App](#quick-start) · [Features](#features) · [Modes](#modes) · [Tools](#agent-tools) · [Screenshots](#showcase) · [Setup](#getting-started)

<br>

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=111)
![ONNX](https://img.shields.io/badge/ONNX%20Runtime-005CED?style=for-the-badge&logo=onnx&logoColor=white)
![KaTeX](https://img.shields.io/badge/KaTeX-008080?style=for-the-badge)
![Monaco](https://img.shields.io/badge/Monaco%20Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)

[![License](https://img.shields.io/badge/license-MIT-e08a4f?style=flat-square)](#license)
[![Status](https://img.shields.io/badge/status-active-22c55e?style=flat-square)](#)
[![UI](https://img.shields.io/badge/UI-dark%20%2B%20light-18181b?style=flat-square)](#theming)
[![i18n](https://img.shields.io/badge/i18n-20%2B%20languages-3b82f6?style=flat-square)](#internationalization)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-d97757?style=flat-square)](#contributing)

</div>

---

## Showcase

> Replace the files under `docs/screenshots/` with real captures.  
> Recommended size: **1600×900** (16:9) PNG or WebP, dark theme preferred.

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/01-chat.png" alt="Chat mode — empty state and suggestions" width="100%">
      <br><sub><b>Chat</b> — empty state, Deep Think, intensity picker</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/02-agent-tools.png" alt="Thought process and tool activity" width="100%">
      <br><sub><b>Thought process</b> — tool calls, file writes, Python</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/03-code-workspace.png" alt="Code workspace with live preview" width="100%">
      <br><sub><b>Code workspace</b> — preview, file tree, Monaco</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/04-agent-team.png" alt="Supervisor agent team" width="100%">
      <br><sub><b>Agent</b> — Supervisor + multi-agent team</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/05-automations.png" alt="Visual automation canvas" width="100%">
      <br><sub><b>Automations</b> — node canvas, wires, triggers</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/06-themes.png" alt="Light and dark themes" width="100%">
      <br><sub><b>Theming</b> — light / dark + accent palettes</sub>
    </td>
  </tr>
</table>

<details>
<summary><b>Extra slots</b> — mobile, files overlay, account, plugins</summary>

<br>

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/07-mobile.png" alt="Mobile layout" width="100%"><br><sub>Phone layout</sub></td>
    <td align="center"><img src="docs/screenshots/08-files.png" alt="Workspace files overlay" width="100%"><br><sub>Virtual filesystem</sub></td>
    <td align="center"><img src="docs/screenshots/09-plugins.png" alt="Plugins panel" width="100%"><br><sub>Plugins</sub></td>
  </tr>
</table>

</details>

---

## Why Think Deeper exists

Most chat UIs send one prompt and hope. Think Deeper is a **browser-native agent runtime**: the model can loop, call tools, write files, run Python, search the web, check its own work, and keep going until the answer is actually done — or you hit Stop.

It is a single HTML application. No build step required to open it. Conversations, files, pins, automations, and (optionally) your API key live in a namespaced store on the device, with optional **Google + Firebase** sync so signed-in users keep chats across refreshes.

> *“An agentic environment that gives ordinary models time, tools, and self-correction so they can solve harder problems reliably.”*

---

## Features

### Chat that actually works a problem

- Streaming replies with Markdown, syntax highlighting, tables, and **KaTeX** math (`$inline$` and `$$display$$`)
- Collapsible **thought process** instead of bulky tool cards
- Attach images and files; pin quotes from a reply and refer back to them
- Branch a conversation from any message, regenerate, continue, copy, or delete
- Projects group related chats; search scans titles and message text
- Optional **Deep Think** for longer-horizon reasoning
- Intensity ladder so you pick cost vs. thoroughness, not just “a model”

### A real workspace, not a transcript

- In-browser **virtual filesystem** (`artifacts/`, `code/`, `memory/`, `uploads/`, `plugins/`, `archive/`, `models/`)
- Automatic version archive when a file is overwritten
- Download chips for files and folders the agent produces
- Live **HTML/CSS/JS preview** and a side editor with Run / Fix / Revert
- Sandboxed **Python** tool with helpers to page through large workspace files
- Optional **external folder** as a second workspace (`external:` paths)

### Code mode

- Split workspace: agent chat on the left, **Preview + Code** on the right
- Inline **Monaco Editor** and a file tree under `code/`
- Skills drawer: TDD, review, refactor, debug, architecture, GitHub ship, frontend, docs, and more
- Connect **GitHub** — create a repo, commit `code/` files, enable Pages
- Phone preview overlay for checking layouts on a small canvas

### Multi-agent “Agent” mode

- A **Supervisor** plans the job and sequences specialists
- Team size 1–8 in Ultra / Extreme Ultra
- Quality selector and a Quick Ask path when you do not need a full team
- Separate agent history in the sidebar

### Automations

- Visual node canvas: drag blocks, pull ports to wire them, scroll to zoom, pan the board
- Triggers: clock, on user send, on AI reply, on broadcast, on new chat
- Actions: silent ask, store value, toast, play HTTPS audio, wait, broadcast
- Logic: “if contains”, plus a **safe JS define** sandbox (`print`, `broadcast`, `store`, `get`, `playAudio`, `toast` only — no `eval`, `fetch`, or `document`)
- Natural-language builder that turns a description into blocks (unsafe requests are refused)

### Identity, memory, and sync

- Guest mode works immediately
- **Google sign-in** via Firebase Auth (or GIS fallback for a local-only account)
- Cloud pull/push of conversations, settings, pins, and automations
- Account profile: name, nickname, photo
- Memory files plus a floating memory assistant that can summarize what the app has stored

### Polish

- Dark and light themes, accent palettes (red, pink, green, orange, yellow, blue, violet)
- Font themes (default Anthropic-inspired pair, serif, mono, round)
- UI scale / text size
- 20+ UI languages via a Weblate-style `locales/<lang>.json` catalog
- Responsive phone layout with a slide-over sidebar

---

## Modes

| Mode | What it is | Best for |
| :--- | :--- | :--- |
| **Chat** | Default agent loop with tools and thought process | Reasoning, writing, research, mixed work |
| **Code** | Dedicated coding shell + live preview + GitHub | Apps, scripts, static sites |
| **Agent** | Supervisor-led team | Long jobs that need parallel specialists |
| **Automations / Canvas** | Node graph of triggers and actions | Recurring jobs, reply hooks, scheduled asks |

### Intensity

Intensity is how hard the agent is allowed to work. It is not a different product — it changes token budget, thoroughness, and whether a team is assembled.

| Level | Label | Token budget (approx.) | Notes |
| :--- | :--- | ---: | :--- |
| `fast` | Fast | ~1.5k | Short answers, tools only if needed |
| `medium` | Medium | ~4k | Default balanced setting |
| `hard` | Hard | ~8k | Plan, tool, verify |
| `ultra` | Ultra | ~16k | Team of 3 — build / check / file |
| `xultra` | Extreme Ultra | ~32k | Signed-in only, maximum precision |

Deep Think can be toggled independently of intensity.

---

## Agent tools

The model does not pretend to have a filesystem. It calls tools.

| Tool | Purpose |
| :--- | :--- |
| `list_files` | List the internal FS or `external:` workspace |
| `read_file` | Read a file, with optional paging (`start` / `length`) |
| `write_file` | Create or overwrite; previous version is archived |
| `delete_file` | Remove a file (archived copy kept) |
| `search_file` | Keyword / regex search with surrounding context |
| `run_python` | Sandboxed Python, workspace mounted under `/workspace` |
| `check_code` | Syntax / compile / HTML balance checks under `code/` |
| `web_search` | Live web search for facts and docs |
| `image_search` | Image research (titles, URLs, source pages) |
| `generate_image` | Text-to-image via the configured image model |
| `run_onnx` | Run a workspace ONNX graph in **ONNX Runtime Web** |
| `self_check` | Record a correctness check before a high-stakes answer |
| `ask_user` | Pause with 3 suggested options + a custom answer |
| `show_site_options` | Offer 5 HTML layout mockups before building a site |
| `github_create_repo` | Create a repository with the connected token |
| `github_commit_files` | Commit files from `code/` |
| `github_enable_pages` | Turn on GitHub Pages |

Plugins can inject extra knowledge into the system prompt. Built-in (off by default): Math & KaTeX, Clean coding, Careful claims, Structured thinking.

---

## Architecture

Think Deeper is a single-page app. The interesting part is the in-page runtime, not a backend you have to host.

```text
┌──────────────────────────────────────────────────────────┐
│                         UIManager                        │
│  Chat · Code · Agent · Automations · Account · Settings  │
└─────────────┬────────────────────────────┬───────────────┘
              │                            │
              ▼                            ▼
        ┌──────────┐                ┌────────────┐
        │  Agent   │── tool calls ─▶│ ToolManager│
        │  loop    │                └─────┬──────┘
        └────┬─────┘                      │
             │                            ├── VirtualFS (localStorage)
             ▼                            ├── ExternalFS (user folder)
      ┌─────────────┐                     ├── PythonTool (sandbox)
      │  Provider   │                     ├── Web / image / GitHub
      │  OpenAI-    │                     └── ONNX Runtime Web
      │  compatible │
      └─────────────┘
             │
     OpenAI · Groq · OpenRouter · Gemini · custom base URL

      CloudSync (optional) ── Firebase Auth + Firestore
```

**Notable libraries (CDN)**

- [marked](https://github.com/markedjs/marked) — Markdown
- [KaTeX](https://katex.org) — math
- [highlight.js](https://highlightjs.org) — code coloring
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — in-app editor
- [ONNX Runtime Web](https://onnxruntime.ai) — in-browser model runs
- [JSZip](https://stuk.github.io/jszip/) — archives / weight import
- [Firebase](https://firebase.google.com) App, Auth, Firestore compat 10.14

The provider talks to any **OpenAI-compatible** Chat Completions endpoint. Gemini uses its native browser API (the OpenAI-style Gemini path is blocked by CORS).

---

## Getting started

### 1. Open the app

This project is designed to run as static files.

```bash
git clone https://github.com/YOUR_USERNAME/think-deeper.git
cd think-deeper
```

Serve the folder with anything that can host static HTML (opening `index.html` as a `file://` page will break some APIs):

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then visit `http://localhost:8080`.

### 2. Point it at a model

1. Open **Settings → API**
2. Pick a preset — OpenAI, Groq, OpenRouter, Gemini, or Custom
3. Paste a base URL and API key
4. Set a main model ID (example: `gpt-4o-mini`)
5. Optionally add more IDs to the **model library** so they appear in the header picker
6. Save

Optional extras in the same panel:

- Separate **talk / code / deep-reason** model IDs
- Image API base, key, and model
- “When building a website, offer 5 layout previews first”
- Import a local `.onnx` / `.pt` / `.gguf` file into the workspace (the browser runs ONNX; PyTorch weights need an external runtime)

### 3. Optional cloud login

To persist chats across devices:

1. Create a Firebase project
2. Enable **Google** in Authentication
3. Create a Firestore database
4. Put the config in `config.local.js` (not committed):

```js
window.__THINK_DEEPER_CONFIG = {
  googleClientId: "xxxxx.apps.googleusercontent.com",
  firebaseConfig: {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  }
};
```

Without Firebase, Google Identity Services can still create a **local-only** account bucket on this device.

---

## Suggested repository layout

```text
.
├── index.html                 # the app
├── README.md
├── LICENSE
├── apple-touch-icon.png
├── Anthropic Serif.woff2      # optional display font
├── Anthropic Sans.woff2
├── config.local.js            # gitignored secrets
├── locales/
│   ├── en.json
│   └── …
└── docs/
    ├── brand/
    │   └── icon.png           # 512×512 app icon
    └── screenshots/
        ├── 01-chat.png
        ├── 02-agent-tools.png
        ├── 03-code-workspace.png
        ├── 04-agent-team.png
        ├── 05-automations.png
        ├── 06-themes.png
        ├── 07-mobile.png
        ├── 08-files.png
        └── 09-plugins.png
```

Add to `.gitignore`:

```gitignore
config.local.js
.DS_Store
```

---

## Theming

The UI is Claude-inspired by default: warm paper in light mode, ink in dark mode, terracotta accent.

| Control | Where |
| :--- | :--- |
| Light / dark | Account / theme controls (`data-theme`) |
| Accent palette | red, pink, green, orange, yellow, blue, violet |
| Font pair | default, serif, mono, round |
| Text size | Settings → UI |

Custom properties live on `:root` / `[data-theme=dark]` (`--accent`, `--bg-primary`, `--font-display`, `--font-body`, …).

---

## Internationalization

Settings → UI → Language. Catalog files are `locales/<lang>.json`. Missing keys fall back to English.

Bundled options include English, Spanish, French, German, Portuguese, Simplified / Traditional Chinese, Japanese, Korean, Russian, Arabic, Hindi, Italian, Dutch, Polish, Turkish, Ukrainian, Vietnamese, Indonesian, and Swedish.

---

## Privacy and safety notes

- API keys are stored only if **Remember API key** is checked, or if a site-wide key is configured by a dev account.
- Guest data stays in this browser’s storage namespace until you sign in.
- Automations refuse prompts that look like malware / credential theft / exploitation.
- The Define block is a small allow-list, not a general JS runtime.
- Code preview iframes are sandboxed.
- Site-wide keys in the Dev panel are write-only in the UI (replace or delete, never displayed again).

This is a powerful local agent. Treat API keys and GitHub tokens like passwords.

---

## Roadmap ideas

Not promises — useful places to extend the project:

- [ ] First-party hosted demo with a public rate-limited key
- [ ] Official PWA manifest + install prompt
- [ ] Per-project isolated filesystems
- [ ] Export / import a full workspace as a zip
- [ ] Real `torch.onnx.export` pipeline instead of the identity ONNX stub
- [ ] More Auth providers than Google
- [ ] Automated screenshot set for this README

---

## Contributing

1. Fork the repo and create a branch (`feat/…` or `fix/…`)
2. Keep the single-file app approach unless a split is clearly better
3. Match existing UI tokens rather than introducing a second design language
4. Open a pull request that says **what broke or what you added**, and how you checked it

Bug reports are most useful when they include:

- Browser and OS
- Provider + model ID (never paste a live key)
- Mode (Chat / Code / Agent / Automations)
- The exact console stack — the agent loop reports fatals as `[Agent] fatal …`

---

## License

MIT. See [`LICENSE`](LICENSE).

You are free to run, fork, and embed Think Deeper. Please do not present a thin reskin as the upstream project.

---

<div align="center">

<img src="docs/brand/icon.png" alt="" width="36" height="36">

**Think Deeper** — time, tools, and self-correction in the browser.

<sub>Replace `docs/brand/icon.png` and `docs/screenshots/*.png` before you publish the repo.</sub>

</div>
