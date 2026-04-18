# Nomads Design Studio

AI design studio for **The Nomads** — a UAE construction and landscaping company specializing in cement rock art, wood art cement, and mud houses in traditional Emirati / Arabic style.

## What it does

1. You describe a project (a majlis wall, a courtyard seat, a mud-brick facade…).
2. Claude asks clarifying questions (structure type, elements, size, indoor/outdoor).
3. Claude generates a full construction plan — materials, build steps, UAE-climate cautions.
4. Claude writes an optimized Flux image prompt.
5. Flux generates the design visual.
6. You add notes and save everything to Google Drive.

## Architecture

```
React (Vite)  ──►  n8n webhooks  ──►  Claude API (claude-sonnet-4-6)
                                   ──►  Flux image API
                                   ──►  Google Drive API
```

All API keys and secrets live in **n8n** — never in the frontend. The React app only talks to n8n webhooks.

## Quick start (dev)

```bash
npm install
cp .env.example .env
# edit .env — set VITE_N8N_BASE_URL
npm run dev
```

Open http://localhost:5173.

## What you need to set up

### 1. Anthropic API key ✅ (you have this)

Use it in n8n only. Model: `claude-sonnet-4-6`.

### 2. Flux (Black Forest Labs) API key

Sign up at https://api.bfl.ai/ (Black Forest Labs — makers of Flux).
Get an API key from your account dashboard.
Use model `flux-pro-1.1` or `flux-dev` depending on budget/quality.

### 3. Google OAuth credentials (for Drive)

1. Go to https://console.cloud.google.com/
2. Create a project (or use an existing one).
3. **APIs & Services → Library → enable "Google Drive API"**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URI: the one shown in n8n's Google Drive credential setup (it will be something like `https://your-tenant.app.n8n.cloud/rest/oauth2-credential/callback`).
5. Download the client ID and client secret.
6. In n8n, create a **Google Drive OAuth2 API** credential with those values and authorize it.

### 4. n8n cloud ✅ (you have this)

Create **four webhook workflows** (see below). They are the backend.

## n8n workflows to create

The React app calls four webhook endpoints. Each one is a workflow in n8n with a **Webhook** trigger → logic → **Respond to Webhook** node.

### Path: `POST /webhook/ask-questions`

- **In**: `{ "description": "string" }`
- **Logic**: Anthropic Messages API call to `claude-sonnet-4-6`. System prompt asks Claude to read the project description and return 4–6 clarifying questions covering: structure type, elements/motifs, size/dimensions, indoor or outdoor, site location in UAE, budget tier. Return as JSON.
- **Out**: `{ "questions": [ { "id": "structure_type", "label": "What type of structure?", "type": "select", "options": ["Wall", "Seat", "Facade", "Column", "Arch"] }, ... ] }`

### Path: `POST /webhook/generate-plan`

- **In**: `{ "description": "string", "answers": { ... } }`
- **Logic**: Anthropic Messages API call. System prompt instructs Claude to produce a UAE-climate-aware construction plan with materials, ordered build steps, and cautions (heat, humidity, salt air, sand). Also produces a Flux-optimized image prompt in the same response (earthy tones, traditional Emirati/Arabic style, warm lighting, no modern look).
- **Out**: `{ "plan": { "materials": [...], "steps": [{"title","detail"}, ...], "cautions": [...] }, "imagePrompt": "string" }`

### Path: `POST /webhook/generate-image`

- **In**: `{ "imagePrompt": "string" }`
- **Logic**: HTTP Request node to Flux API (`POST https://api.bfl.ai/v1/flux-pro-1.1` with the prompt). Flux returns a polling URL; use a Wait + follow-up GET loop until the image is ready, then return the result URL (or upload the bytes to Drive and return the shareable link).
- **Out**: `{ "imageUrl": "https://..." }`

### Path: `POST /webhook/save-project`

- **In**: `{ name, description, answers, plan, imagePrompt, imageUrl, notes }`
- **Logic**:
  1. Google Drive — create a folder named `Nomads Projects / {name} — {YYYY-MM-DD}`.
  2. Write `plan.md` with the full plan + answers + notes.
  3. Download the image from `imageUrl` and upload as `design.png` into the folder.
  4. Write `metadata.json` with the whole payload.
- **Out**: `{ "driveLink": "https://drive.google.com/drive/folders/..." }`

### Optional: shared-secret auth

To prevent anyone from calling your webhooks, set `VITE_N8N_SHARED_KEY` in `.env`. The app sends it as `X-Nomads-Key` on every request. In n8n, add a Header Auth credential to each webhook node expecting the same value.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git → select the repo**.
3. Build command: `npm run build`. Publish directory: `dist` (already in `netlify.toml`).
4. **Site settings → Environment variables**: add
   - `VITE_N8N_BASE_URL` = your n8n webhook base URL
   - `VITE_N8N_SHARED_KEY` (optional)
5. Deploy.

## Tech

- Vite + React 18 + TypeScript
- No CSS framework — hand-rolled earthy theme in `src/index.css`
- Mobile-first, no tracking, no analytics

## Brand notes

- Earthy warm palette — beige, sand, brown, clay, terracotta.
- Serif headings (Georgia) + sans body. No crisp modern white.
- UAE identity: motifs, desert palette, traditional materials.
