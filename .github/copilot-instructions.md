# Copilot Instructions for Crackle

## Overview
Crackle is a command-line tool to brute-force and solve the daily Wordle puzzle. It operates by filtering a list of possible answers based on user-provided guesses and Wordle's feedback (green/yellow/black). The main logic is in `crackle.py`, and the word list is in `wordle_answers.txt`.

## Key Files
- `crackle.py`: Main script. Contains CLI, interactive mode, and filtering logic.
- `wordle_answers.txt`: List of valid 5-letter Wordle answers (one per line).
- `README.md`: Basic project description.

## Usage Patterns
- **CLI Mode:**
  - Run with `--guess` and `--result` arguments to filter possible answers.
  - Example: `python crackle.py --guess crane --result bgybb`
- **Interactive Mode:**
  - Run with no arguments. Enter guesses and results interactively.
  - Example: `python crackle.py`

## Word Filtering + Suggestions Logic
- `filter_words(possible_words, guess, result)` applies Wordle rules:
  - `g` (green): Letter must match at that position.
  - `y` (yellow): Letter must be present elsewhere, not at that position.
  - `b` (black): Letter is not present, unless it appears as green/yellow elsewhere in the guess (handles repeats correctly).
- Candidate ranking is done by `rank_words(words)` which:
  - Computes positional and global letter frequencies from current candidates.
  - Scores words by positional frequency + unique-letter coverage.
  - Applies a light duplicate-letter penalty (stronger when many candidates remain).
  - Adds a small vowel bonus when the pool is large (>= ~80) to encourage exploration.
  - Returns words sorted best-first; CLI and interactive modes show the top 10.

## Developer Workflows
- No build step required; run directly with Python 3.7+.
- No external dependencies.
- To add or update the word list, edit `wordle_answers.txt` (one word per line, all lowercase).
 - For quick smoke testing, import functions in a REPL:
   - `from crackle import load_words, filter_words, rank_words`
   - `cands = load_words(); rank_words(cands)[:10]`

## Project Conventions
- All code is in a single file (`crackle.py`).
- Uses standard library only.
- Prints ASCII art banner on startup.
- Exits with error if `wordle_answers.txt` is missing.
 - Suggestions prefer breadth (unique letters, vowels) when the pool is large, shifting to positional matches as it narrows.

## Example
```sh
python crackle.py --guess slate --result bgybb
```

## Tips for AI Agents
- Always validate guess and result formats (5 letters, valid chars).
- When modifying filtering logic, ensure compatibility with Wordle's rules for repeated letters.
- Keep user experience clear: error messages, banner, and suggestions are important.

