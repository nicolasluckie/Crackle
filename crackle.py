import re
import argparse
import sys
from pathlib import Path
from textwrap import dedent
import random


# ===== ASCII Art Banner =====
def print_banner():
    print(
        dedent("""\

         ██████╗██████╗  █████╗  ██████╗██╗  ██╗██╗     ███████╗
        ██╔════╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██║     ██╔════╝
        ██║     ██████╔╝███████║██║     █████╔╝ ██║     █████╗  
        ██║     ██╔══██╗██╔══██║██║     ██╔═██╗ ██║     ██╔══╝  
        ╚██████╗██║  ██║██║  ██║╚██████╗██║  ██╗███████╗███████╗
        ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝

    """)
    )


# ===== Load Word List =====
def load_words(filepath="wordle_answers.txt"):
    path = Path(filepath)
    if not path.exists():
        print(f"❌ Error: {filepath} not found.")
        sys.exit(1)
    with open(filepath, "r", encoding="utf-8") as f:
        return [
            w.strip().lower() for w in f if len(w.strip()) == 5 and w.strip().isalpha()
        ]


# ===== Word Filter Logic =====
def filter_words(possible_words, guess, result):
    new_possible = []
    for word in possible_words:
        match = True
        for i in range(5):
            g_letter = guess[i]
            r = result[i]
            if r == "g" and word[i] != g_letter:
                match = False
                break
            elif r == "y":
                if g_letter not in word or word[i] == g_letter:
                    match = False
                    break
            elif r == "b":
                # Improved gray logic: only exclude if the count of g_letter in word
                # exceeds the number of green/yellow matches for that letter in the guess
                g_count_in_gy = sum(
                    1 for j in range(5) if guess[j] == g_letter and result[j] in "gy"
                )
                if word.count(g_letter) > g_count_in_gy:
                    match = False
                    break
        if match:
            new_possible.append(word)
    return new_possible


# ===== Ranking Logic (Intelligent Suggestions) =====
def _compute_frequencies(words):
    """Compute positional and global letter frequencies from remaining candidates.

    Returns:
        pos_counts: list[dict] length 5, counts per position
        letter_counts: dict overall letter counts across all positions
    """
    pos_counts: list[dict[str, int]] = [dict() for _ in range(5)]
    letter_counts: dict[str, int] = {}
    for w in words:
        for i, ch in enumerate(w):
            pos_counts[i][ch] = pos_counts[i].get(ch, 0) + 1
            letter_counts[ch] = letter_counts.get(ch, 0) + 1
    return pos_counts, letter_counts


def _word_score(word, pos_counts, letter_counts, pool_size):
    """Score a word using:
    - Positional frequency (primary)
    - Unique-letter coverage (secondary)
    - Light penalty for duplicate letters (early)
    - Small vowel bonus when pool is large (exploration)
    """
    # Positional score: prefer letters common in their exact positions.
    pos_score = sum(pos_counts[i].get(ch, 0) for i, ch in enumerate(word))

    # Coverage score: favor words that cover frequent letters (unique to avoid double counting).
    uniq = set(word)
    cov_score = sum(letter_counts.get(ch, 0) for ch in uniq)

    # Duplicate penalty (scaled higher when many candidates remain).
    dup_count = len(word) - len(uniq)
    early_factor = 1.0 if pool_size >= 40 else pool_size / 40.0
    dup_penalty = dup_count * 50 * early_factor  # light but noticeable

    # Vowel bonus to quickly identify patterns early on.
    vowels = set("aeiou")
    vowel_count = sum(1 for ch in uniq if ch in vowels)
    vowel_bonus = 120 if (pool_size >= 80 and vowel_count >= 2) else 0

    # Blend scores. Coefficients tuned for sane ordering without overfitting.
    score = pos_score + 0.35 * cov_score + vowel_bonus - dup_penalty
    return score


def rank_words(words):
    """Rank remaining candidate words using frequency-based heuristics.

    Strategy distilled from common Wordle tactics:
    - Prefer letters that occur frequently in remaining candidates and positions.
    - Avoid duplicate letters early; value unique-letter coverage.
    - Slightly favor words with 2+ vowels when the space is large.
    """
    if not words:
        return []
    pos_counts, letter_counts = _compute_frequencies(words)
    pool_size = len(words)
    return sorted(
        words,
        key=lambda w: _word_score(w, pos_counts, letter_counts, pool_size),
        reverse=True,
    )


# ===== Play Mode (Emoji Feedback) =====
def compute_feedback(guess: str, target: str) -> str:
    """Return Wordle-style emoji feedback for a guess against target.

    Uses correct duplicate handling:
    1) Mark greens and reduce available counts
    2) Mark yellows only if remaining counts allow
    3) Otherwise mark black
    """
    green = "🟩"
    yellow = "🟨"
    black = "⬛"

    feedback = [black] * 5
    # Count target letters
    counts: dict[str, int] = {}
    for i, ch in enumerate(target):
        if guess[i] == ch:
            feedback[i] = green
        else:
            counts[ch] = counts.get(ch, 0) + 1

    # Second pass for yellows
    for i, ch in enumerate(guess):
        if feedback[i] != green:
            if counts.get(ch, 0) > 0:
                feedback[i] = yellow
                counts[ch] -= 1
            else:
                feedback[i] = black
    return "".join(feedback)


def run_play_mode(word_list):
    target = random.choice(word_list)
    print("🎮 Play Mode: Guess the 5-letter word! Type 'q' to quit.")
    guesses = 0
    while True:
        guess = input("Enter your guess: ").strip().lower()
        if guess == "q":
            print("👋 Exiting play mode.")
            break
        if not re.fullmatch(r"[a-z]{5}", guess):
            print("❌ Must be a 5-letter word (a-z).")
            continue
        guesses += 1
        fb = compute_feedback(guess, target)
        print(f"{fb}  ({guess.upper()})")
        if guess == target:
            print(
                f"🎯 You cracked it in {guesses} guesses! The word is: {target.upper()}"
            )
            break


# ===== CLI Mode =====
def run_cli_mode(args, word_list):
    guess = args.guess.lower()
    result = args.result.lower()

    if not re.fullmatch(r"[a-z]{5}", guess):
        print("❌ Invalid guess. Must be a 5-letter word.")
        return
    if not re.fullmatch(r"[gyb]{5}", result):
        print("❌ Invalid result. Use only g, y, b.")
        return

    new_words = filter_words(word_list, guess, result)
    ranked = rank_words(new_words)
    print(f"🧠 Words remaining: {len(new_words)}")
    print("📝 Suggestions:", ", ".join(ranked[:10]).upper() or "None")
    if len(new_words) == 1:
        print("🎉 You've cracked it with Crackle!")


# ===== Interactive Mode =====
def run_interactive_mode(word_list):
    possible_words = word_list[:]
    guesses = 0
    while True:
        guess = input("\nEnter your guess (or 'q' to quit): ").lower()
        if guess == "q":
            break
        if not re.fullmatch(r"[a-z]{5}", guess):
            print("❌ Must be a 5-letter word.")
            continue

        result = input("Enter result (g=green, y=yellow, b=black): ").lower()
        if not re.fullmatch(r"[gyb]{5}", result):
            print("❌ Result must be 5 characters using g/y/b.")
            continue

        guesses += 1
        possible_words = filter_words(possible_words, guess, result)
        ranked = rank_words(possible_words)
        print(f"🧠 Words remaining: {len(possible_words)}")
        print("📝 Suggestions:", ", ".join(ranked[:10]).upper() or "None")

        if len(possible_words) == 1:
            print(
                f"🎯 Cracked it in {guesses} guesses! The word is: {possible_words[0].upper()}"
            )
            break
        elif len(possible_words) == 0:
            print("⚠️ No valid words left. Check your inputs!")
            break


# ===== Main Entry Point =====
def main():
    print_banner()
    word_list = load_words()

    parser = argparse.ArgumentParser(
        description="CRACKLE: Brute-force the daily Wordle... with style.",
        epilog="Example: python crackle.py --guess crane --result bgybb",
    )
    parser.add_argument("--guess", help="Your 5-letter guess")
    parser.add_argument("--result", help="Result from Wordle (e.g. gbybb)")
    parser.add_argument(
        "--play",
        action="store_true",
        help="Play a Wordle-like game with emoji feedback",
    )
    args = parser.parse_args()

    if args.play:
        run_play_mode(word_list)
    elif args.guess and args.result:
        run_cli_mode(args, word_list)
    else:
        run_interactive_mode(word_list)


if __name__ == "__main__":
    main()
