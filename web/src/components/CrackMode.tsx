import { useState, useEffect, useRef } from "react";
import { Button, Flex, Heading, Text, Card, Spinner, Callout, Link } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import axios from "axios";
import gif from "../assets/ya-done-messed-up.gif";
import {
  getCachedWordList,
  cacheWordList,
  clearWordListCache,
} from "../utils/wordListCache";
import "./CrackMode.css";

interface CrackModeProps {
  onBack: () => void;
}

interface GuessHistory {
  guess: string;
  result: string;
}

const API_URL = "http://localhost:5000";

// Default starting suggestions for optimal Wordle solving
const DEFAULT_SUGGESTIONS = [
  "TARSE",
  "SALET",
  "CRATE",
  "SLATE",
  "TRACE",
  "CRANE",
  "CARLE",
  "AROSE",
  "SOARE",
  "ROATE",
];

const SUBMIT_LOADING_MESSAGES = [
  "Filtering words...",
  "Analyzing patterns...",
  "Calculating best guesses...",
  "Processing feedback...",
  "Narrowing down options...",
  "Crunching the data...",
  "Finding matches...",
  "Just a moment...",
];

function CrackMode({ onBack }: CrackModeProps) {
  const [possibleWords, setPossibleWords] = useState<string[]>([]);
  const [rankedWords, setRankedWords] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [currentGuess, setCurrentGuess] = useState("");
  const [currentResult, setCurrentResult] = useState("");
  const [guessHistory, setGuessHistory] = useState<GuessHistory[]>([]);
  const [error, setError] = useState("");
  const [successWord, setSuccessWord] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLoadingMessage, setSubmitLoadingMessage] = useState("");

  // Refs for smooth scrolling
  const statsCardRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWordList();
  }, []);

  // Add keyboard event listener for physical keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard if game is won
      if (successWord) return;

      const key = event.key.toUpperCase();

      // Handle Enter key
      if (key === "ENTER") {
        handleSubmitGuess();
        return;
      }

      // Handle Backspace
      if (key === "BACKSPACE") {
        // If result is being entered (guess is full), backspace the result
        if (currentGuess.length === 5 && currentResult.length > 0) {
          setCurrentResult(currentResult.slice(0, -1));
        }
        // Otherwise backspace the guess
        else if (currentGuess.length > 0 && currentResult.length === 0) {
          setCurrentGuess(currentGuess.slice(0, -1));
        }
        return;
      }

      // If guess is complete (5 letters), handle G/Y/B for result
      if (currentGuess.length === 5) {
        if (currentResult.length < 5 && ["G", "Y", "B"].includes(key)) {
          setCurrentResult(currentResult + key);
        }
      }
      // Otherwise, handle letter input for guess
      else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
        setCurrentGuess(currentGuess + key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentGuess, currentResult, successWord]);

  // Smooth scroll helper function
  const scrollToElement = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  // Handler for suggestion click
  const handleSuggestionClick = (word: string) => {
    setCurrentGuess(word.toUpperCase());
    // Scroll to submit button after suggestion click
    setTimeout(() => {
      scrollToElement(submitButtonRef);
    }, 100);
  };

  const loadWordList = async () => {
    try {
      // Try to get from cache first
      const cachedWords = getCachedWordList();

      if (cachedWords && cachedWords.length > 0) {
        console.log("Using cached word list:", cachedWords.length, "words");
        setPossibleWords(cachedWords);
        setRankedWords(DEFAULT_SUGGESTIONS); // Use default suggestions initially
        return;
      }

      // If not cached (shouldn't happen if MainMenu loaded it), fetch from API as fallback
      console.log("Cache empty, fetching word list from API...");
      const response = await axios.get(`${API_URL}/api/words`);
      const words = response.data.words;

      // Cache the word list for future use
      cacheWordList(words);
      console.log("Word list cached:", words.length, "words");

      setPossibleWords(words);
      setRankedWords(DEFAULT_SUGGESTIONS); // Use default suggestions initially
    } catch (err) {
      setError(
        "Failed to load word list. Make sure the API server is running."
      );
      console.error(err);
    }
  };

  const handleSubmitGuess = async () => {
    if (currentGuess.length !== 5) {
      setError("Guess must be exactly 5 letters");
      return;
    }

    if (currentResult.length !== 5) {
      setError("Result must be exactly 5 characters (g/y/b)");
      return;
    }

    if (!/^[a-zA-Z]+$/.test(currentGuess)) {
      setError("Guess must contain only letters");
      return;
    }

    if (!/^[gyb]+$/i.test(currentResult)) {
      setError("Result must contain only g (green), y (yellow), or b (black)");
      return;
    }

    setIsSubmitting(true);
    const randomMessage =
      SUBMIT_LOADING_MESSAGES[
        Math.floor(Math.random() * SUBMIT_LOADING_MESSAGES.length)
      ];
    setSubmitLoadingMessage(randomMessage);

    try {
      const response = await axios.post(`${API_URL}/api/filter`, {
        possible_words: possibleWords,
        guess: currentGuess.toLowerCase(),
        result: currentResult.toLowerCase(),
      });

      const { filtered, ranked, count } = response.data;

      setGuessHistory([
        ...guessHistory,
        {
          guess: currentGuess.toUpperCase(),
          result: currentResult.toLowerCase(),
        },
      ]);
      setPossibleWords(filtered);
      setRankedWords(ranked.slice(0, 10));
      setCurrentGuess("");
      setCurrentResult("");
      setError("");
      setIsSubmitting(false);

      // Scroll to stats card after submission
      setTimeout(() => {
        scrollToElement(statsCardRef);
      }, 100);

      if (count === 1) {
        setSuccessWord(ranked[0].toUpperCase());
      }
    } catch (err) {
      setError("Failed to filter words");
      setIsSubmitting(false);
      console.error(err);
    }
  };

  const handleGuessKeyPress = (key: string) => {
    if (key === "ENTER") {
      handleSubmitGuess();
    } else if (key === "BACKSPACE") {
      setCurrentGuess(currentGuess.slice(0, -1));
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(currentGuess + key);
    }
  };

  const handleResultKeyPress = (key: string) => {
    if (currentResult.length < 5 && ["G", "Y", "B"].includes(key)) {
      setCurrentResult(currentResult + key);
    } else if (key === "BACKSPACE") {
      setCurrentResult(currentResult.slice(0, -1));
    }
  };

  const renderGuessHistoryRow = (item: GuessHistory, index: number) => {
    const letters = item.guess.split("");
    const results = item.result.split("");

    return (
      <div key={index} className="history-row">
        {letters.map((letter, i) => (
          <div
            key={i}
            className={`letter-box ${
              results[i] === "g"
                ? "correct"
                : results[i] === "y"
                ? "present"
                : "absent"
            }`}
          >
            {letter}
          </div>
        ))}
      </div>
    );
  };

  const renderCurrentGuessRow = () => {
    const letters = currentGuess.toUpperCase().padEnd(5, " ").split("");
    return (
      <div className="guess-row">
        {letters.map((letter, i) => (
          <div
            key={i}
            data-testid={`letter-box-${i}`}
            className={`letter-box ${letter === " " ? "empty" : "filled"}`}
          >
            {letter !== " " ? letter : ""}
          </div>
        ))}
      </div>
    );
  };

  const renderCurrentResultRow = () => {
    const results = currentResult.toLowerCase().padEnd(5, " ").split("");
    return (
      <div className="result-row">
        {results.map((result, i) => (
          <div
            key={i}
            data-testid={`result-box-${i}`}
            className={`result-box ${
              result === "g"
                ? "result-green"
                : result === "y"
                ? "result-yellow"
                : result === "b"
                ? "result-black"
                : "empty"
            }`}
          >
            {result !== " " ? result.toUpperCase() : ""}
          </div>
        ))}
      </div>
    );
  };

  const guessKeyboard = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  const resultKeyboard = [["G", "Y", "B", "BACKSPACE"]];

  const resetGame = (event?: React.MouseEvent) => {
    // If Shift key is held, also clear the cache
    if (event?.shiftKey) {
      clearWordListCache();
      console.log("Cache cleared. Reloading word list...");
    }

    loadWordList();
    setGuessHistory([]);
    setCurrentGuess("");
    setCurrentResult("");
    setError("");
    setSuccessWord(null);
  };

  return (
    <div className="crack-mode">
      <div className="game-header">
        <Button variant="soft" onClick={onBack} className="back-button">
          Back
        </Button>
        <Heading size="6">Crack Wordle</Heading>
        <Button variant="soft" onClick={resetGame} className="reset-button">
          Reset
        </Button>
      </div>

      {error && error.includes("API") && (
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

      <div className="content-wrapper">
        <div className="results-section">
          <Card className="stats-card" ref={statsCardRef}>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                Words Remaining: {possibleWords.length}
              </Text>
              <Text size="2" weight="bold">
                Guesses Made: {guessHistory.length}
              </Text>
            </Flex>
          </Card>

          <Card className="suggestions-card">
            <Heading size="4" mb="2">
              Top Suggestions
            </Heading>
            {rankedWords.length > 0 ? (
              <div className="suggestions-list">
                {rankedWords.map((word, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(word)}
                  >
                    <Text size="3" weight="bold">
                      {word.toUpperCase()}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-words-message">
                <Text size="3" weight="bold" color="red" className="error-msg">
                  No words remaining
                </Text>
                <br />
                <div
                  style={{
                    width: "100%",
                    height: "220px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={gif}
                    alt="No words remaining"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      display: "block",
                      borderRadius: "14px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                    }}
                  />
                </div>
              </div>
            )}
          </Card>

          <Card className="history-card">
            <Heading size="4" mb="2">
              Guess History
            </Heading>
            <div className="history-list">
              {guessHistory.length > 0 ? (
                guessHistory.map((item, index) =>
                  renderGuessHistoryRow(item, index)
                )
              ) : (
                <Text color="gray" size="2">
                  No guesses yet. Enter your first guess below!
                </Text>
              )}
            </div>
          </Card>
        </div>

        <div className="input-section">
          {successWord && (
            <Card className="win-message">
              <Flex direction="column" align="center" gap="2">
                <Heading size="5">
                  🎉 You cracked it in {guessHistory.length} guess
                  {guessHistory.length !== 1 ? "es" : ""}!
                </Heading>
                <Text size="3">
                  The word is{" "}
                  <strong>
                    <span className="success-msg">{successWord}</span>
                  </strong>
                </Text>
                <Button onClick={resetGame} size="3">
                  Start Over
                </Button>
              </Flex>
            </Card>
          )}

          <Card className="input-card">
            <Flex direction="column" gap="3" align="center">
              <div>
                <Text size="2" weight="bold" mb="1">
                  Enter Your Guess
                </Text>
                {renderCurrentGuessRow()}
              </div>

              <div>
                <Text size="2" weight="bold" mb="1">
                  Enter Result (G/Y/B)
                </Text>
                {renderCurrentResultRow()}
              </div>
            </Flex>
          </Card>

          {error && !error.includes("API") ? (
            <>
              <Callout.Root color="red" className="error-callout">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                  {error}
                </Callout.Text>
              </Callout.Root>
            </>
          ) : (
            <div className="instructions">
              <Text size="1" color="gray" className="instruction-desktop">
                <span className="instructions-text-green">
                  G = Green (correct position) |{" "}
                </span>
                <span className="instructions-text-yellow">
                  Y = Yellow (wrong position) |{" "}
                </span>
                <span className="instructions-text-black">B</span>{" "}
                <span className="instructions-text-white">
                  = Black (not in word)
                </span>
              </Text>
              <div className="instruction-mobile">
                <Text size="1" color="gray">
                  <span className="instructions-text-green">
                    G = Green (correct position)
                  </span>
                </Text>
                <Text size="1" color="gray">
                  <span className="instructions-text-yellow">
                    Y = Yellow (wrong position)
                  </span>
                </Text>
                <Text size="1" color="gray">
                  <span className="instructions-text-black">B</span>{" "}
                  <span className="instructions-text-white">
                    = Black (not in word)
                  </span>
                </Text>
              </div>
            </div>
          )}

          <div className={`keyboard ${successWord ? "disabled" : ""}`}>
            <Text size="2" weight="bold" className="keyboard-label">
              Guess Keyboard
            </Text>
            {guessKeyboard.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((key) => (
                  <button
                    key={key}
                    className={`key ${
                      key === "ENTER" || key === "BACKSPACE" ? "key-wide" : ""
                    }`}
                    onClick={() => handleGuessKeyPress(key)}
                    disabled={!!successWord}
                  >
                    {key === "BACKSPACE" ? "⌫" : key}
                  </button>
                ))}
              </div>
            ))}

            <Text
              size="2"
              weight="bold"
              className="keyboard-label"
              style={{ marginTop: "1rem" }}
            >
              Result Keyboard
            </Text>
            {resultKeyboard.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((key) => (
                  <button
                    key={key}
                    className={`key ${
                      key === "G"
                        ? "key-green"
                        : key === "Y"
                        ? "key-yellow"
                        : key === "B"
                        ? "key-black"
                        : "key-wide"
                    }`}
                    onClick={() => handleResultKeyPress(key)}
                    disabled={!!successWord}
                  >
                    {key === "BACKSPACE" ? "⌫" : key}
                  </button>
                ))}
              </div>
            ))}

            <div ref={submitButtonRef}>
              <Button
                size="3"
                onClick={handleSubmitGuess}
                className="submit-button"
                disabled={
                  currentGuess.length !== 5 ||
                  currentResult.length !== 5 ||
                  !!successWord ||
                  isSubmitting
                }
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
        </div>
      </div>
    </div>
  );
}

export default CrackMode;
