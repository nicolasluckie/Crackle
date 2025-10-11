import os
import tempfile
import unittest

from crackle import (
    load_words,
    filter_words,
    compute_feedback,
    rank_words,
)


class TestLoadWords(unittest.TestCase):
    def test_load_words_from_custom_file(self):
        # Create a temporary word list
        with tempfile.TemporaryDirectory() as td:
            fp = os.path.join(td, "words.txt")
            with open(fp, "w", encoding="utf-8") as f:
                f.write("apple\n\nBANJO\ncar\ncrane\nlever\n")
            words = load_words(fp)
            # Only 5-letter alpha words, lowercased
            self.assertEqual(
                sorted(words), sorted(["apple", "banjo", "crane", "lever"])
            )


class TestFilterWords(unittest.TestCase):
    def test_all_black_eliminates_letters(self):
        pool = ["slate", "stare", "trace", "cigar"]
        out = filter_words(pool, "slate", "bbbbb")
        # With all blacks, none of the letters in the guess can appear in the word
        self.assertEqual(out, [])

    def test_mixed_green_yellow_black(self):
        # Guess: CRATE, result: G B Y B B
        # Constraints: word[0]=='c'; includes 'a' not at pos2; no 'r','t','e' anywhere.
        pool = ["cacao", "cabal", "capon", "caper", "crock"]
        out = filter_words(pool, "crate", "gbybb")
        self.assertEqual(sorted(out), sorted(["cacao", "cabal", "capon"]))

    def test_duplicate_gray_limits_letter_count(self):
        # Validates the gray-duplicate rule:
        # Guess: BELLE, Result: B G Y B B
        # - word[1] must be 'e' (green)
        # - letter 'l' must appear somewhere but NOT at index 2 (yellow at pos2)
        # - black 'l' at pos3 means total 'l' count must not exceed the number of g/y for 'l' (i.e., exactly 1 'l')
        # - black 'e' at pos4 means total 'e' count must not exceed g/y for 'e' (i.e., exactly 1 'e' at pos1)
        # - black 'b' at pos0 means there is no 'b' in the word
        pool = [
            "reply",  # valid: e at idx1, one 'l' at idx3
            "pearl",  # valid: e at idx1, one 'l' at idx4
            "leall",  # invalid: too many 'l' (should be excluded by improved gray logic)
            "beryl",  # invalid: contains 'b' while 'b' is black
            "felon",  # invalid: 'l' at idx2 where it must not be (yellow position)
        ]
        out = filter_words(pool, "belle", "bgybb")
        self.assertEqual(sorted(out), sorted(["reply", "pearl"]))


class TestComputeFeedback(unittest.TestCase):
    def test_feedback_basic(self):
        self.assertEqual(compute_feedback("crane", "crane"), "🟩🟩🟩🟩🟩")

    def test_feedback_with_duplicates(self):
        # target=belle, guess=level -> 🟨🟩⬛🟨🟨
        fb = compute_feedback("level", "belle")
        self.assertEqual(fb, "🟨🟩⬛🟨🟨")


class TestRankWords(unittest.TestCase):
    def test_rank_preserves_words(self):
        words = ["stare", "slate", "trace", "cigar", "level"]
        ranked = rank_words(words)
        self.assertEqual(set(ranked), set(words))
        self.assertEqual(len(ranked), len(words))


if __name__ == "__main__":
    unittest.main(verbosity=2)
