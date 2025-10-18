# Copilot Instructions for Crackle

## Overview
Crackle is a Wordle solver and practice tool with both a web interface and CLI. Users can practice Wordle with emoji feedback or get intelligent suggestions to crack the daily puzzle. The project includes a Flask API backend, React + TypeScript frontend, Docker deployment with security isolation, and privacy-focused analytics.

## Project Structure

### Backend (Python)
- `crackle.py` — Core logic: filtering, ranking, emoji feedback generation. CLI entry point.
- `api.py` — Flask REST API serving the web frontend and exposing word filtering/play endpoints.
- `wordle_answers.txt` — 14,801 filtered 5-letter words (profanity removed, family-friendly).
- `tests/test_crackle.py` — Unit tests (unittest + pytest), including duplicate-letter edge cases.
- `requirements.txt` — Python dependencies (Flask, flask-cors, gunicorn for production).

### Frontend (React + TypeScript)
- `web/src/App.tsx` — Main application with mode routing (Practice/Crack).
- `web/src/components/MainMenu.tsx` — Mode selection with word list preloading.
- `web/src/components/PracticeMode.tsx` — Play unlimited Wordle games with emoji feedback.
- `web/src/components/CrackMode.tsx` — Get suggestions to solve the daily Wordle.
- `web/src/utils/analytics.ts` — Rybbit analytics tracking (privacy-focused, no cookies).
- `web/src/utils/wordListCache.ts` — localStorage caching (7-day expiration, 200KB word list).
- `web/src/test/` — Vitest + React Testing Library tests for all components.

### Docker Deployment
- `docker/Dockerfile` — Multi-stage build: frontend builder → backend → nginx frontend.
- `docker/docker-compose.yml` — Two-container architecture with security isolation.
- `docker/nginx.conf` — Reverse proxy config, security headers, API proxying.
- `docker/.env.production` — Environment template (ALLOWED_ORIGINS, CORS config).
- `docker/manage.sh` & `manage.bat` — Management scripts for start/stop/rebuild/logs.

### Documentation
- `README.md` — Main project readme with features, setup, usage.
- `docker/README.md` — Comprehensive Docker deployment guide.
- `web/src/test/README.md` — Testing documentation and best practices.
- `PRIVACY.md` — Privacy policy (GDPR-compliant, no cookies, anonymous analytics).
- `.github/copilot-instructions.md` — This file; comprehensive project guide for AI assistance.

## Core Behaviors and Functions

### Backend Logic (`crackle.py`)
- `filter_words(possible_words, guess, result)`
  - **g**: exact match at position.
  - **y**: letter exists but wrong position.
  - **b**: improved duplicate-aware logic — black only excludes candidates where letter count exceeds green/yellow instances.
- `rank_words(words)`
  - Ranks by positional frequency + unique-letter coverage.
  - Light duplicate-letter penalty (scaled with pool size) and small vowel bonus when pool is large (>= ~80).
- `compute_feedback(guess, target)`
  - Emoji feedback (🟩/🟨/⬛) with correct duplicate handling: mark greens first, then yellows based on remaining counts.

### API Endpoints (`api.py`)
- `GET /api/words` — Returns full word list (14,801 words).
- `POST /api/filter` — Filters words based on guess/result (Crack mode).
- `POST /api/play/new` — Starts new practice game, returns session ID.
- `POST /api/play/guess` — Submits guess, returns emoji feedback and game state.
- `GET /api/health` — Health check endpoint for Docker.
- `GET /` (catch-all) — Serves React frontend in production.

### Frontend Features
- **Practice Mode**: Unlimited Wordle games with instant emoji feedback, win/loss stats.
- **Crack Mode**: Real-time word filtering, ranked suggestions (top 10), remaining word count.
- **Smart Context Switching**: Auto-switches between guess/result input in Crack mode.
- **Physical + On-screen Keyboards**: Type or click, both methods tracked separately.
- **Smooth Scrolling**: Auto-scrolls to suggestions ↔ submit ↔ stats sections.
- **Word List Caching**: localStorage cache (7-day expiration) for 200KB word list.
- **Client-side Validation**: Rejects invalid guesses instantly (Practice mode optimization).
- **Loading States**: Animated spinners with randomized loading messages.
- **Dark Theme**: "Shades of Purple" theme with animated backgrounds.

## Developer Workflows

### Local Development
```bash
# Backend
python api.py  # Flask API on http://localhost:5000

# Frontend (from web/ directory)
npm install
npm run dev    # React dev server on http://localhost:5173
# OR
npm start      # Runs both Flask + React concurrently
```

### Testing
```bash
# Backend
pytest                       # Run Python tests
pre-commit run --all-files   # Lint, format, type-check, test

# Frontend (from web/ directory)
npm test                     # Run Vitest tests
npm run test:ui              # Vitest UI
npm run coverage             # Test coverage report
```

### Production Build
```bash
# Docker deployment
cd docker
docker network create cloudflare_network  # One-time setup
cp .env.production .env                     # Configure ALLOWED_ORIGINS
docker-compose up -d                        # Build & run
docker-compose logs -f                      # View logs

# Manual build (from web/ directory)
npm run build                # Output: web/dist/
```

### Management
```bash
# Docker commands (from docker/ directory)
./manage.sh start|stop|restart|rebuild|logs|status|health|shell|clean

# Windows
manage.bat start|stop|restart|rebuild|logs|status|health|shell|clean
```

## Security Architecture

### Docker Network Isolation
- **crackle-internal** (bridge): Backend ↔ Frontend communication only.
- **cloudflare_network** (external): Frontend exposed with alias `crackle` for Cloudflare tunnel.
- **Backend isolation**: Flask port 5000 NOT exposed to host, only accessible via nginx proxy.
- **Frontend gateway**: nginx on port 8080 (or 80 internal), serves static files + proxies `/api/*`.

### CORS Configuration
- Production: `ALLOWED_ORIGINS=https://example.domain.com` (exact match required).
- Development: `http://localhost:5173,http://localhost:8080`.
- Docker: Requests are same-origin via nginx proxy (CORS not needed).

### Security Headers (nginx)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`

## Analytics (Privacy-Focused)

### Rybbit Integration
- **Privacy**: No cookies, anonymous, GDPR-compliant, country-level location only.

### Tracked Events
- **mode-selected**: When user picks Practice/Crack mode.
- **practice-guess**: Each guess (word, number, correct, method: click/enter).
- **practice-win**: Game completion (total guesses, target word).
- **crack-guess**: Each guess (word, number, words_remaining, method: click/enter).
- **crack-win**: Puzzle solved (total guesses, cracked word).
- **crack-messed-up**: No words remaining (total guesses).
- **new-game**: New Practice game started.
- **reset-game**: Crack mode reset.
- **back-button**: Navigation to main menu (from: practice/crack).

### NOT Tracked
- Individual keyboard key presses (letters, backspace).
- Result keyboard clicks (G/Y/B buttons).
- Suggestion clicks (planned but not implemented).
- Page views (only tracked manually for key screens).
- Errors or exceptions.

## Project Conventions and Gotchas

### Python
- `crackle.py` is single-file with stdlib only (no external deps for core logic).
- Preserve ASCII banner spacing (trailing-whitespace hook excludes this file).
- Validate inputs: guess `[a-z]{5}`, result `[gyb]{5}`.
- `wordle_answers.txt` must exist at runtime.

### Frontend
- Environment variables: `VITE_API_URL` (dev: `http://localhost:5000`, prod: empty for relative URLs).
- Word list caching: `wordListCache.ts` with 7-day expiration.
- Analytics: All tracking via `analytics.ts` utility functions.
- Submission method tracking: Distinguish between button clicks and Enter key presses.

### Docker
- Backend has NO external port mapping (`expose: 5000` only).
- Frontend is ONLY externally accessible container (port 8080).
- `.env` file required in `docker/` directory (copy from `.env.production`).
- Cloudflare tunnel connects to `http://crackle:80` via Docker network.

### Testing
- Backend: unittest + pytest in `tests/` (run with `pytest`).
- Frontend: Vitest + React Testing Library in `web/src/test/`.
- CI: GitHub Actions on Ubuntu/Windows with Python 3.9–3.13.
- Pre-commit: Runs ruff lint/format, mypy, pytest.

### Word List
- **Original**: 14,854 words from [dracos/valid-wordle-words.txt](https://gist.github.com/dracos/dd0668f281e685bad51479e5acaadb93).
- **Filtered**: Removed 53 profanity words via [google-profanity-words](https://github.com/coffee-and-fun/google-profanity-words/blob/main/data/en.txt).
- **Final**: 14,801 family-friendly 5-letter words.

## Test Highlights (Use as Patterns)

### Backend (`tests/test_crackle.py`)
- `TestComputeFeedback.test_feedback_with_duplicates` — Duplicate emoji feedback (e.g., target="belle", guess="level").
- `TestFilterWords.test_duplicate_gray_limits_letter_count` — Ensures gray feedback limits letter counts rather than excluding entirely.

### Frontend (`web/src/test/`)
- `MainMenu.test.tsx` — Mode selection, loading states, word list preloading.
- `PracticeMode.test.tsx` — Guess submission, emoji feedback, win/loss states, new game.
- `CrackMode.test.tsx` — Filtering, suggestions, result input, reset, physical keyboard.
- `wordListCache.test.ts` — localStorage caching, expiration, version invalidation.

## CLI Usage Examples

### Interactive Helper (Default)
```bash
python crackle.py
# Enter guess + result interactively
```

### Filter-Only Mode
```bash
python crackle.py --guess crane --result bgybb
# Prints remaining count + top 10 suggestions
```

### Play Mode
```bash
python crackle.py --play
# Random target with emoji feedback
```

## Production Deployment

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+.
- Cloudflare Zero Trust tunnel (optional, for public access).

### Deployment Steps
1. Clone repo and navigate to `docker/` directory.
2. Create external network: `docker network create cloudflare_network`.
3. Copy `.env.production` to `.env` and set `ALLOWED_ORIGINS`.
4. Build and start: `docker-compose up -d`.
5. Verify: `curl http://localhost:8080/api/health` (should succeed).
6. Verify isolation: `curl http://localhost:5000` (should fail).
7. Configure Cloudflare tunnel to `http://crackle:80` (or `http://localhost:8080`).

### Access Points
- **Local testing**: `http://localhost:8080`
- **Production**: `https://example.domain.com` (via Cloudflare tunnel)
- **Backend**: Internal only, NOT accessible externally

## Key Files to Reference

- **Backend logic**: `crackle.py` (filter_words, rank_words, compute_feedback)
- **API endpoints**: `api.py` (Flask routes, CORS config)
- **Frontend main**: `web/src/App.tsx` (mode routing)
- **Practice mode**: `web/src/components/PracticeMode.tsx`
- **Crack mode**: `web/src/components/CrackMode.tsx`
- **Analytics**: `web/src/utils/analytics.ts`
- **Caching**: `web/src/utils/wordListCache.ts`
- **Docker**: `docker/Dockerfile`, `docker/docker-compose.yml`, `docker/nginx.conf`
- **Tests**: `tests/test_crackle.py`, `web/src/test/*.test.tsx`

## Technology Stack

### Backend
- Python 3.7+ (tested with 3.9–3.13)
- Flask 3.1+
- flask-cors 5.0+
- Gunicorn (production WSGI server)

### Frontend
- React 19 with TypeScript
- Vite 7 (build tool)
- Radix UI Themes 3 (UI library)
- Axios 1.12 (HTTP client)
- Vitest 3 (testing framework)
- React Testing Library

### Infrastructure
- Docker (multi-stage builds)
- nginx (reverse proxy, static file server)
- Cloudflare Zero Trust (tunnel, SSL termination)
- Umami Analytics (privacy-focused, self-hosted)

### Development Tools
- pre-commit (ruff, mypy, pytest)
- GitHub Actions (CI/CD)
- git-chglog (changelog generation)
- ESLint + TypeScript compiler

## Roadmap Status
- ✅ React + TypeScript web UI with Vite
- ✅ Backend unit tests using unittest + pytest
- ✅ Frontend unit tests (Vitest + React Testing Library)
- ✅ Shades of Purple theme with animations
- ✅ Production build & deployment using Docker
- ✅ Privacy-focused analytics (Umami)
- ✅ Word list caching optimization
- ✅ Client-side validation (Practice mode)
- ✅ Security isolation (Docker networking)
- ✅ Cloudflare Zero Trust tunnel integration
