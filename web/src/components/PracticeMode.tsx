import { useState, useEffect } from 'react';
import { Button, Flex, Heading, Text, Card, Spinner, Callout } from '@radix-ui/themes';
import axios from 'axios';
import './PracticeMode.css';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import {
  trackPracticeGuess,
  trackPracticeWin,
  trackBackButton,
  trackNewGame,
} from '../utils/analytics';
import {
  getCachedWordList,
  cacheWordList,
} from '../utils/wordListCache';

interface PracticeModeProps {
  onBack: () => void;
}

interface GuessResult {
  guess: string;
  feedback: string;
  isRevealing?: boolean;
}

// Use environment variable for API URL
// In development: http://localhost:5000
// In production (Docker): empty string = relative URLs through nginx proxy
const API_URL = import.meta.env.VITE_API_URL || "";

const SUBMIT_LOADING_MESSAGES = [
  'Checking the word...',
  'Consulting the dictionary...',
  'Crunching the letters...',
  'Validating your guess...',
  'Analyzing the pattern...',
  'Thinking really hard...',
  'Almost there...',
  'Processing your guess...',
];

function PracticeMode({ onBack }: PracticeModeProps) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLoadingMessage, setSubmitLoadingMessage] = useState('');
  const [wordList, setWordList] = useState<string[]>([]);
  const [disabledLetters, setDisabledLetters] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWordList();
    startNewGame();
  }, []);

  const loadWordList = async () => {
    try {
      // Try to get from cache first
      const cachedWords = getCachedWordList();

      if (cachedWords && cachedWords.length > 0) {
        console.log("Practice Mode: Using cached word list:", cachedWords.length, "words");
        setWordList(cachedWords.map(w => w.toLowerCase()));
        return;
      }

      // If not cached, fetch from API
      console.log("Practice Mode: Fetching word list from API...");
      const response = await axios.get(`${API_URL}/api/words`);
      const words = response.data.words;

      // Cache for future use
      cacheWordList(words);
      console.log("Practice Mode: Word list cached:", words.length, "words");
      setWordList(words.map((w: string) => w.toLowerCase()));
    } catch (err) {
      console.error("Failed to load word list for validation:", err);
      // Continue without validation if word list fails to load
    }
  };

  const startNewGame = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/play/new`);
      setGameId(response.data.game_id);
      setGuesses([]);
      setCurrentGuess('');
      setGameWon(false);
      setTarget(null);
      setError('');
      setDisabledLetters(new Set());
    } catch (err) {
      setError('Failed to start game. Make sure the API server is running.');
      console.error(err);
    }
  };

  const handleSubmitGuess = async (method: 'click' | 'enter' = 'click') => {
    if (currentGuess.length !== 5) {
      setError('Guess must be exactly 5 letters');
      return;
    }

    if (!/^[a-zA-Z]+$/.test(currentGuess)) {
      setError('Guess must contain only letters');
      return;
    }

    // Client-side word validation to avoid unnecessary API calls
    if (wordList.length > 0 && !wordList.includes(currentGuess.toLowerCase())) {
      setError('Not in word list');
      return;
    }

    setIsSubmitting(true);
    const randomMessage = SUBMIT_LOADING_MESSAGES[Math.floor(Math.random() * SUBMIT_LOADING_MESSAGES.length)];
    setSubmitLoadingMessage(randomMessage);

    try {
      const response = await axios.post(`${API_URL}/api/play/guess`, {
        game_id: gameId,
        guess: currentGuess.toLowerCase(),
      });

      const { feedback, correct, target: revealedTarget } = response.data;

      // Track the guess
      const guessNumber = guesses.length + 1;
      trackPracticeGuess(currentGuess, guessNumber, correct, method);

      // Add the guess with revealing animation
      const newGuess: GuessResult = {
        guess: currentGuess.toUpperCase(),
        feedback,
        isRevealing: true,
      };
      setGuesses([...guesses, newGuess]);
      setCurrentGuess('');
      setError('');
      setIsSubmitting(false);

      // Update disabled letters based on feedback (⬛ = black/absent)
      const newDisabledLetters = new Set(disabledLetters);
      const guessLetters = currentGuess.toUpperCase().split('');
      const feedbackEmojis = [...feedback];

      guessLetters.forEach((letter, index) => {
        if (feedbackEmojis[index] === '⬛') {
          newDisabledLetters.add(letter);
        }
      });
      setDisabledLetters(newDisabledLetters);

      // After animation completes, remove the revealing flag
      setTimeout(() => {
        setGuesses((prevGuesses) =>
          prevGuesses.map((g, i) =>
            i === prevGuesses.length - 1 ? { ...g, isRevealing: false } : g
          )
        );

        if (correct) {
          setGameWon(true);
          setTarget(revealedTarget.toUpperCase());
          trackPracticeWin(guessNumber, revealedTarget);
        }
      }, 1500); // 5 letters * 0.3s = 1.5s
    } catch (err) {
      setError('Failed to submit guess');
      setIsSubmitting(false);
      console.error(err);
    }
  };

  const handleKeyPress = (key: string) => {
    if (gameWon) return;

    if (key === 'ENTER') {
      handleSubmitGuess('click');
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key) && !disabledLetters.has(key)) {
      setCurrentGuess(currentGuess + key);
    }
  };

  useEffect(() => {
    const handlePhysicalKeyPress = (e: KeyboardEvent) => {
      if (gameWon) return;

      if (e.key === 'Enter') {
        handleSubmitGuess('enter');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyPress);
    return () => window.removeEventListener('keydown', handlePhysicalKeyPress);
  }, [currentGuess, gameWon, guesses, gameId, disabledLetters]);

  const renderGuessRow = (guess: string, feedback: string, index: number, isRevealing = false) => {
    const letters = guess.split('');
    const emojis = [...feedback];

    return (
      <div key={index} className="guess-row">
        {letters.map((letter, i) => {
          const colorClass = emojis[i] === '🟩' ? 'correct' : emojis[i] === '🟨' ? 'present' : 'absent';
          const animationDelay = isRevealing ? `${i * 0.3}s` : '0s';

          return (
            <div
              key={i}
              className={`letter-box ${isRevealing ? '' : colorClass} ${isRevealing ? 'revealing' : ''}`}
              style={{ animationDelay }}
              data-color={colorClass}
            >
              {letter}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCurrentGuessRow = () => {
    const letters = currentGuess.toUpperCase().padEnd(5, ' ').split('');
    return (
      <div className="guess-row">
        {letters.map((letter, i) => (
          <div key={i} className={`letter-box ${letter === ' ' ? 'empty' : 'filled'}`}>
            {letter !== ' ' ? letter : ''}
          </div>
        ))}
      </div>
    );
  };

  const keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  return (
    <div className="practice-mode">
      <div className="game-header">
        <Button variant="soft" onClick={() => {
          trackBackButton('practice');
          onBack();
        }} className="back-button">
          Back
        </Button>
        <Heading size="6">Practice Mode</Heading>
        <Button variant="soft" onClick={() => {
          trackNewGame('practice');
          startNewGame();
        }}>
          New Game
        </Button>
      </div>

      {error && (
        <>
          <div style={{marginBottom: '1.25rem'}}>
            <Callout.Root color="red" className="error-callout">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                {error}
              </Callout.Text>
            </Callout.Root>
          </div>
        </>
      )}

      <div className="game-board">
        {guesses.map((result, index) =>
          renderGuessRow(result.guess, result.feedback, index, result.isRevealing)
        )}
        {!gameWon && renderCurrentGuessRow()}
      </div>

      {gameWon && (
        <Card className="win-message">
          <Flex direction="column" align="center" gap="2">
            <Heading size="5">🎯 You cracked it in {guesses.length} guess
              {guesses.length !== 1 ? 'es' : ''}!</Heading>
            <Text size="3">
              The word was <strong><span className="success-msg">{target}</span></strong>
            </Text>
            <Button onClick={startNewGame} size="3">
              Play Again
            </Button>
          </Flex>
        </Card>
      )}

      <div className="keyboard">
        {keyboard.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => {
              const isDisabled = disabledLetters.has(key);
              return (
                <button
                  key={key}
                  className={`key ${key === 'ENTER' || key === 'BACKSPACE' ? 'key-wide' : ''} ${isDisabled ? 'key-disabled' : ''}`}
                  onClick={() => handleKeyPress(key)}
                  disabled={gameWon || isDisabled}
                >
                  {key === 'BACKSPACE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}

        <Button
          size="3"
          onClick={() => handleSubmitGuess('click')}
          className="submit-button"
          disabled={gameWon || currentGuess.length !== 5 || isSubmitting}
        >
          {isSubmitting ? (
            <Flex align="center" gap="2">
              <Spinner size="2" />
              {submitLoadingMessage}
            </Flex>
          ) : (
            "Submit Guess"
          )}
        </Button>
      </div>
    </div>
  );
}

export default PracticeMode;
