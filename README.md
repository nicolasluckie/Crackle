# crackle

Practice with a random word and unlimited guesses! 🟩🟨⬛

```
python crackle.py --play
```

or crack the daily Wordle 😉

```
python crackle.py
```

<a href="https://github.com/nicolasluckie/crackle/actions/workflows/ci.yml">
	<img src="https://img.shields.io/github/actions/workflow/status/nicolasluckie/crackle/ci.yml?branch=main&label=Tests&logo=githubactions&logoColor=white" alt="CI Tests Status" />
</a>

## How It Works

A list of 14,855 valid 5-letter Wordle answers is loaded from `wordle_answers.txt`. Obtained from [dracos/valid-wordle-words.txt](https://gist.github.com/dracos/dd0668f281e685bad51479e5acaadb93).

You can then enter a guess and the corresponding results (g/y/b) to filter down the possible answers.

- **g** = (correct letter in the correct position)
- **y** = (correct letter, wrong position)
- **b** = (letter not in the word, removes all remaining words containing that letter)

There is no limit to the number of guesses you can enter.

Next-word suggestions are ranked by positional and global letter frequency and unique-letter coverage, with a light duplicate-letter penalty and a small vowel bonus when many candidates remain.

## Prerequisites
- Python 3.7+  (no external dependencies)
- Word list: `wordle_answers.txt` must be present in the same directory.
- Suggestions shown in helper modes are ranked using positional and global letter frequencies, favoring unique-letter coverage with a light duplicate-letter penalty and a small vowel bonus when many candidates remain.

## Usage

### Interactive (Default)

Interactive helper (enter guesses and g/y/b results):

```
python crackle.py
```

### Play

Play mode (emoji feedback: 🟩 🟨 ⬛, unlimited guesses):

```
python crackle.py --play
```

### CLI (filter-only)

Filter candidates from a guess + feedback:

```
python crackle.py --guess slate --result bgybb
```

### Success messages:

Play mode:

`🎯 Cracked it in N guesses! The word is: WORD`

Interactive helper:

`🎯 Cracked it in N guesses! The word is: WORD`

CLI (filter-only):

`🎉 You've cracked it with Crackle!`

## Testing

- Run everything (lint, type-checks, tests):

```
pre-commit run --all-files
```

- Just the unit tests:

```
pytest
```

## Examples

### Interactive Mode (Default)

```
$ python crackle.py
Enter your guess (or 'q' to quit): slate
Enter result (g=green, y=yellow, b=black): bybby
🧠 Words remaining: 283
📝 Suggestions: RILED, OILED, MOLED, POLED, COLED, DOLEY, HOLED, LOLED, VOLED, PILED

Enter your guess (or 'q' to quit): riled
Enter result (g=green, y=yellow, b=black): ybygb
🧠 Words remaining: 21
📝 Suggestions: LOPER, LOVER, LONER, LOWER, LUGER, MOREL, BOREL, FOREL, LUXER, LUREX

Enter your guess (or 'q' to quit): loper
Enter result (g=green, y=yellow, b=black): gbbgg
🧠 Words remaining: 5
📝 Suggestions: LUGER, LUXER, LURER, LEGER, LEVER

Enter your guess (or 'q' to quit): leger
Enter result (g=green, y=yellow, b=black): ggbgg
🧠 Words remaining: 1
📝 Suggestions: LEVER
🎯 Cracked it in 4 guesses! The word is: LEVER
```

### Play mode

```
$ python crackle.py --play
🎮 Play Mode: Guess the 5-letter word! Type 'q' to quit.
Enter your guess: slate
⬛🟨⬛⬛🟨  (SLATE)
Enter your guess: crane
🟨🟩⬛⬛⬛  (CRANE)
Enter your guess: crone
🟩🟩🟩🟩🟩  (CRONE)
🎯 Cracked it in 3 guesses! The word is: CRONE
```

### CLI (filter-only)

```
$ python crackle.py --guess slate --result bgybb
🧠 Words remaining: 123
📝 Suggestions: CRANE, TRACE, GRACE, ...
```
