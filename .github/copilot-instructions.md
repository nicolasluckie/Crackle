# Copilot Instructions for Crackle

## Overview
Crackle is a small CLI tool to help solve the daily Wordle puzzle by filtering a 5-letter answer list based on a guess and feedback (g/y/b) and by ranking candidate words.
All logic lives in a single file (`crackle.py`), with tests in `tests/` and a plain text word list in `wordle_answers.txt`.

## Key files
- `crackle.py` — entry point, CLI/interactive/play modes, filtering, ranking, emoji feedback.
- `tests/test_crackle.py` — unit tests (unittest + pytest runner), including duplicate-letter edge cases.
- `wordle_answers.txt` — 5-letter answers, one per line (required at runtime unless tests pass custom data).
- `.pre-commit-config.yaml` — runs ruff lint/format, mypy, and pytest.
- `.github/workflows/ci.yml` — CI runs pre-commit on Ubuntu/Windows with Python 3.9–3.13.

## Core behaviors and functions
- `filter_words(possible_words, guess, result)`
  - g: exact match at position.
  - y: letter must exist in the word but not at that position.
  - b: improved duplicate-aware logic — a letter shown as black only excludes candidates where the count of that letter exceeds the number of green/yellow instances for that letter in the same guess.
- `rank_words(words)`
  - Ranks by positional frequency + unique-letter coverage.
  - Light duplicate-letter penalty (scaled stronger with larger pools) and small vowel bonus when pool is large (>= ~80).
- `compute_feedback(guess, target)`
  - Emoji feedback (🟩/🟨/⬛) with correct duplicate handling: mark greens, then yellows based on remaining counts.

## Modes and CLI
- Interactive helper (default): `python crackle.py` → enter guess + g/y/b.
- Filter-only: `python crackle.py --guess crane --result bgybb` → prints remaining count + top 10 suggestions.
- Play mode: `python crackle.py --play` → random target with emoji feedback.

## Developer workflows
- Run everything (lint, type-checks, tests): `pre-commit run --all-files`.
- Just tests: `pytest` (pytest discovers `unittest` tests in `tests/`).
- Quick smoke in REPL: `from crackle import load_words, filter_words, rank_words`.
- CI uses `actions/setup-python` with pip cache keyed by `.pre-commit-config.yaml`; no `requirements.txt` in this repo.

## Project conventions and gotchas
- Single-file implementation using stdlib; tests in `tests/` (unittest style).
- Preserve ASCII banner spacing in `crackle.py` (trailing-whitespace hook excludes this file).
- Validate inputs: guess `[a-z]{5}`, result `[gyb]{5}`.
- `wordle_answers.txt` must be present when running the app (exits with a helpful error if missing).

## Test highlights (use as patterns)
- `TestComputeFeedback.test_feedback_with_duplicates` — duplicate emoji feedback (e.g., target="belle", guess="level").
- `TestFilterWords.test_duplicate_gray_limits_letter_count` — ensures gray feedback limits letter counts rather than excluding the letter entirely.

## Example
```
python crackle.py --guess slate --result bgybb
```
