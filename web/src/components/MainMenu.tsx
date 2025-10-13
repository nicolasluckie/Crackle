import { useState, useEffect } from "react";
import { Box, Card, Flex, Heading, Text, Spinner } from "@radix-ui/themes";
import axios from 'axios';
import { getCachedWordList, cacheWordList } from '../utils/wordListCache';
import "./MainMenu.css";
import LetterGlitch from "./ReactBits/LetterGlitch";
import DecryptedText from "./ReactBits/DecryptedText";


interface MainMenuProps {
  onSelectMode: (mode: "practice" | "crack") => void;
}

const API_URL = 'http://localhost:5000';

const LOADING_MESSAGES = [
  'Loading word list...',
  'Preparing suggestions...',
  'Initializing solver...',
  'Gathering vocabulary...',
  'Setting up the game...',
  'Getting ready...',
  'Just a moment...',
];

const PRACTICE_LOADING_MESSAGES = [
  //'Starting new game...',
  'Picking a word...'
  //'Preparing the game...',
  //'Getting ready...',
  //'Just a moment...',
];

function MainMenu({ onSelectMode }: MainMenuProps) {
  const [isLoadingCrack, setIsLoadingCrack] = useState(false);
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    if (isLoadingCrack || isLoadingPractice) {
      // Set random message when loading starts
      const messages = isLoadingCrack ? LOADING_MESSAGES : PRACTICE_LOADING_MESSAGES;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setLoadingMessage(randomMessage);
    }
  }, [isLoadingCrack, isLoadingPractice]);

  const loadWordList = async () => {
    // Try to get from cache first
    const cachedWords = getCachedWordList();

    if (cachedWords && cachedWords.length > 0) {
      console.log('Using cached word list:', cachedWords.length, 'words');
      return;
    }

    // If not cached, fetch from API
    console.log('Fetching word list from API...');
    const response = await axios.get(`${API_URL}/api/words`);
    const words = response.data.words;

    // Cache the word list for future use
    cacheWordList(words);
    console.log('Word list cached:', words.length, 'words');
  };

  const handleCrackModeClick = async () => {
    setIsLoadingCrack(true);
    try {
      await loadWordList();
      onSelectMode("crack");
    } catch (err) {
      console.error('Failed to load word list:', err);
      // Still transition even if there's an error - the CrackMode component will show the error
      onSelectMode("crack");
    } finally {
      setIsLoadingCrack(false);
    }
  };

  const handlePracticeModeClick = async () => {
    setIsLoadingPractice(true);
    try {
      // Just transition - PracticeMode will handle game initialization
      // We just show a brief loading state for consistency
      await new Promise(resolve => setTimeout(resolve, 100));
      onSelectMode("practice");
    } catch (err) {
      console.error('Failed to start practice mode:', err);
      onSelectMode("practice");
    } finally {
      setIsLoadingPractice(false);
    }
  };

  return (
    <div className="main-menu">
      <div className="letter-glitch-background">
        <LetterGlitch
          glitchColors={['#667eea', '#764ba2', '#9333ea']}
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        />
      </div>
      <div className="banner">
        <pre>
{` ██████╗██████╗  █████╗  ██████╗██╗  ██╗██╗     ███████╗
██╔════╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██║     ██╔════╝
██║     ██████╔╝███████║██║     █████╔╝ ██║     █████╗
██║     ██╔══██╗██╔══██║██║     ██╔═██╗ ██║     ██╔══╝
╚██████╗██║  ██║██║  ██║╚██████╗██║  ██╗███████╗███████╗
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝`}
        </pre>
      </div>

      <Flex direction="column" gap="4" align="center" className="menu-content">
        {/* <Heading size="6" className="subtitle">
          <DecryptedText text="Choose Your Mode" animateOn="view" sequential={true} speed={20} maxIterations={10} />
        </Heading> */}

        <Card size="2" className="mode-card" asChild>
          <button
            onClick={handlePracticeModeClick}
            className="mode-button"
            disabled={isLoadingPractice || isLoadingCrack}
          >
            <Flex gap="4" align="center">
              <Box className="mode-icon">🎮</Box>
              <Box>
                <Text as="div" weight="bold">
                  <DecryptedText text="Practice Mode" animateOn="view" sequential={true} speed={20} maxIterations={10} />
                </Text>
                <Text as="div" color="gray">
                  {isLoadingPractice ? (
                    <Flex align="center" gap="2">
                      <Spinner size="1" />
                      {loadingMessage}
                    </Flex>
                  ) : (
                    <DecryptedText text="Play with an unlimited number of guesses!" animateOn="view" sequential={true} speed={20} maxIterations={10} />
                  )}
                </Text>
              </Box>
            </Flex>
          </button>
        </Card>

        <Card size="2" className="mode-card" asChild>
          <button
            onClick={handleCrackModeClick}
            className="mode-button"
            disabled={isLoadingCrack || isLoadingPractice}
          >
            <Flex gap="4" align="center">
              <Box
                className="mode-icon"
                style={{ transform: "translate(2px, 0px)" }}
              >
                💥
              </Box>
              <Box>
                <Text as="div" weight="bold">
                  <DecryptedText text="Crack Wordle" animateOn="view" sequential={true} speed={20} maxIterations={10} />
                </Text>
                <Text as="div" color="gray">
                  {isLoadingCrack ? (
                    <Flex align="center" gap="2">
                      <Spinner size="1" />
                      {loadingMessage}
                    </Flex>
                  ) : (
                    <DecryptedText text="Get smart suggestions to solve the daily Wordle." animateOn="view" sequential={true} speed={20} maxIterations={10} />
                  )}
                </Text>
              </Box>
            </Flex>
          </button>
        </Card>
      </Flex>
    </div>
  );
}

export default MainMenu;
