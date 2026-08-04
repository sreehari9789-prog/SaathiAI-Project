# Saathi — Voice Assistant for MSME Workers

A full-stack rebuild of the Saathi prototype: a voice-first assistant that
routes a single spoken (or typed) message to one of five tools, plus real
login/signup, a dashboard, and a dedicated page per tool — all with 3D GSAP
animation throughout.

## What's inside

```
saathi/
├── backend/            Pure Node.js API — no npm install required
│   ├── server.js        All routes: auth, assistant, memory, workshare,
│   │                     fairwage, safety, grievance, dashboard
│   ├── lib/
│   │   ├── store.js      Tiny JSON-file database (data/db.json)
│   │   ├── auth.js       Password hashing + signed session tokens
│   │   └── intent.js     Multilingual keyword intent classifier
│   └── data/db.json      Created automatically on first run
│
└── frontend/           Static multi-page site
    ├── serve.js          Zero-dependency static file server
    ├── index.html        Landing page + mini voice console
    ├── login.html / signup.html
    ├── dashboard.html    Protected — your stats & activity
    ├── assistant.html    Full voice assistant (speak or type)
    ├── memory.html       Tool 01 — Knowledge Memory
    ├── workshare.html    Tool 02 — AI WorkShare
    ├── fairwage.html     Tool 03 — FairWage Estimator
    ├── safety.html       Tool 04 — Safety Reporter (new)
    ├── grievance.html    Tool 05 — Helpline (new)
    └── assets/
        ├── css/style.css
        └── js/{api.js, app.js, voice.js}
```

## Running it

You need [Node.js](https://nodejs.org) 16 or later. Nothing else — no
`npm install`, no database server, no API keys.

**1. Start the backend** (in one terminal):
```bash
cd backend
node server.js
```
It listens on `http://localhost:4000` and creates `backend/data/db.json`
on first run.

**2. Start the frontend** (in a second terminal):
```bash
cd frontend
node serve.js
```
It serves the site at `http://localhost:5500`.

**3. Open `http://localhost:5500` in your browser.**

Use Chrome or Edge for the voice features — they have the best support for
the Web Speech API (speech-to-text and text-to-speech), which runs entirely
in the browser. If your browser doesn't support it, every page also has a
type-to-send fallback, so nothing is voice-only.

## How the voice assistant works

1. You tap the mic and speak (or type into the fallback box).
2. The browser's Web Speech API turns your speech into text — free, and
   works in Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada,
   Punjabi, and English via the language selector.
3. The text is sent to `POST /api/assistant/query` on the backend.
4. The backend classifies which of the five tools the message belongs to,
   performs that tool's action (saves a fix, matches a task, calculates a
   wage, logs a hazard, files a grievance), and returns a plain-text reply.
5. The reply is shown on screen **and** spoken back using the browser's
   text-to-speech — so it works for people who'd rather listen than read.

## Accounts

Sign up with just a name, phone number, unit name, and password — no email,
no OTP service required for the prototype. Passwords are hashed with
`scrypt`; sessions use a signed token (HMAC-SHA256), similar in spirit to a
JWT but built on Node's built-in `crypto` module so there's nothing to
install.

## Notes on the two new tools

- **Safety Reporter** — report a hazard (spark, leak, exposed wire) by
  voice or text; Saathi guesses a severity level and logs it immediately,
  so it isn't forgotten by the end of a shift.
- **Helpline** — a confidential channel for pay disputes, unfair treatment,
  or harassment, separate from the public Knowledge Memory log.

Both extend the existing three-tool prototype (Knowledge Memory, AI
WorkShare, FairWage Estimator) without changing how they work.

## Moving beyond the prototype

This still follows the roadmap in the original technical architecture doc:
the JSON-file store here stands in for PostgreSQL + pgvector, and the
keyword-based intent classifier stands in for a fine-tuned multilingual
NLU model. Swapping either out later doesn't require touching the frontend
— the API contract stays the same.
