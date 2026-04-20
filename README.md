# Vault — AI Privacy Gateway

Vault sits between your employees and any LLM. It automatically finds sensitive data in prompts — names, emails, API keys, passwords, IPs — replaces them with placeholder tokens before sending to the AI, then swaps the real values back into the response. The AI never sees your actual data.

---

## The problem it solves

People paste sensitive stuff into AI tools without thinking. Database credentials in a code snippet they're debugging. A client's full name and SSN in a document summary request. An API key they're asking for help rotating. Most companies have either banned AI tools entirely because of this, or allowed unrestricted access and crossed their fingers. Vault is the middle ground.

---

## How the pipeline works

```
Raw prompt → Detect PII → Mask → Send to Gemini → Rehydrate → User gets full response
```

1. You submit a prompt
2. Three detection layers run (explained below)
3. Sensitive values get replaced: `john@acme.com` → `[EMAIL_ADDRESS_1]`
4. The clean prompt goes to the llm being used.
5. The response comes back with placeholders
6. Original values are restored before you see anything
7. Session mapping is deleted from memory

---

## Detection — three layers

**Layer 1: Presidio + spaCy NER**

Uses Microsoft Presidio with a spaCy `en_core_web_lg` model to catch the "human" data that requires context: names, emails, phone numbers, credit cards, SSNs, IBANs, IPs, locations, dates, URLs, crypto addresses. Confidence threshold is set at 0.40.

**Layer 2: Custom regex patterns**

Nine patterns for developer-specific secrets that NLP models don't understand:

- `api_key=`, `password=`, `secret=`, `token=` labelled assignments
- `postgresql://`, `mongodb://` connection strings
- Mixed special-character secrets like `67$3@#kaesf`
- Generic tokens ≥ 20 alphanumeric characters
- PEM private key headers
- Partial/malformed IP addresses (`192.12.12`)
- Raw unformatted phone numbers (`9711232345`)

**Layer 3: Shannon entropy scanning**

High-entropy strings are secrets. Random credentials have measurably higher information density than natural language. Any token ≥ 8 characters with Shannon entropy > 3.2 bits gets flagged as `SECRET`. This catches JWTs, session tokens, hashes, and anything else that looks random but doesn't match a known pattern.

The tokeniser splits on whitespace and punctuation but keeps special characters inside tokens intact — so `67$3@#kaesf` is treated as one token, not broken at the `$`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Uvicorn (Python) |
| PII Detection | Microsoft Presidio 2.2 + spaCy 3.8 |
| LLM | Gemini 2.0 Flash via google-genai SDK |
| Database | SQLite + SQLAlchemy (async) |
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Fonts | Syne + IBM Plex Mono |

---

## Project structure

```
vault/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes
│   │   ├── core/         # detector, masker, rehydrator
│   │   ├── llm/          # Gemini client + prompt templates
│   │   ├── session/      # in-memory token→value store
│   │   ├── db/           # SQLAlchemy models + CRUD
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── config.py
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/          # fetch wrappers
    │   ├── components/   # Layout, ChatBox, MaskViewer, EntityBadge, StatCard
    │   ├── hooks/        # usePrompt (session state)
    │   └── pages/        # ChatPage, DashboardPage
    ├── index.html
    └── vite.config.js
```

---

## Setup

**Backend**

```bash
cd vault/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_lg

uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd vault/frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite proxy forwards `/api/*` to the FastAPI backend automatically.

---


---

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/prompt` | Run the full masking pipeline |
| `GET` | `/api/dashboard/` | Aggregated session statistics |

The `/api/prompt` endpoint accepts `{ prompt, system_message? }` and returns the masked prompt, LLM response, detected entities with confidence scores, and a summary of entity types found.

---

## Dashboard

The monitoring dashboard shows total prompts processed, PII fields masked, and a breakdown by entity type — both as a bar chart and a sortable table with percentage shares. Everything is pulled from the SQLite audit log. If the DB write fails for any reason, the user still gets their response — logging is non-blocking.

---

## Session persistence

Chat history is preserved when navigating between the Terminal and Dashboard pages. State lives in `App.jsx` rather than inside `ChatPage`, so it never unmounts during navigation. The PII Inspector panel on the right side of the chat page accumulates all detected entities across the full session.

---

## Known limitations

- No user authentication yet — single-user deployment only
- English language PII only (regex and entropy scanning work on any language)
- In-memory session store resets on server restart

---


