import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import PracticeMode from '../components/PracticeMode';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('PracticeMode', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Setup default cached word list
    const cachedData = {
      words: ['apple', 'crane', 'slate', 'stale', 'steal', 'split', 'found', 'month', 'world', 'barer'],
      timestamp: Date.now(),
      version: '1.0',
    };
    localStorage.setItem('crackle_word_list', JSON.stringify(cachedData));
    localStorage.setItem('crackle_word_list_version', '1.0');
  });

  it('renders the component with initial state', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        game_id: 'test-game-123',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });
  });

  it('allows typing a guess using on-screen keyboard', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        game_id: 'test-game-123',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    const cButton = screen.getByRole('button', { name: 'C' });
    const rButton = screen.getByRole('button', { name: 'R' });
    const aButton = screen.getByRole('button', { name: 'A' });
    const nButton = screen.getByRole('button', { name: 'N' });
    const eButton = screen.getByRole('button', { name: 'E' });

    await userEvent.click(cButton);
    await userEvent.click(rButton);
    await userEvent.click(aButton);
    await userEvent.click(nButton);
    await userEvent.click(eButton);

    // Verify guess is displayed
    const letterBoxes = document.querySelectorAll('.letter-box.filled');
    expect(letterBoxes).toHaveLength(5);
  });

  it('disables letters marked as black after submitting guess', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        game_id: 'test-game-123',
      },
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '⬛🟨🟩⬛⬛', // C=black, R=yellow, A=green, N=black, E=black
        correct: false,
        target: 'stale',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    // Type and submit guess
    await userEvent.keyboard('CRANE');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Wait for the guess to be processed
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThan(0);
    });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 1600));

    // Check that C, N, E buttons are disabled (marked as black)
    const cButton = screen.getByRole('button', { name: 'C' });
    const nButton = screen.getByRole('button', { name: 'N' });
    const eButton = screen.getByRole('button', { name: 'E' });
    const rButton = screen.getByRole('button', { name: 'R' });
    const aButton = screen.getByRole('button', { name: 'A' });

    expect(cButton).toBeDisabled();
    expect(nButton).toBeDisabled();
    expect(eButton).toBeDisabled();
    expect(rButton).not.toBeDisabled(); // R was yellow
    expect(aButton).not.toBeDisabled(); // A was green
  });

  it('prevents typing disabled letters with physical keyboard', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        game_id: 'test-game-123',
      },
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '⬛⬛🟩🟩🟩', // C=black, R=black, A=green, N=green, E=green
        correct: false,
        target: 'stale',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    // First guess
    await userEvent.keyboard('CRANE');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThan(0);
    });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 1600));

    // Try to type C and R (should be blocked)
    await userEvent.keyboard('CRATE');

    // Should only have 'ATE' typed (C and R blocked)
    const filledBoxes = document.querySelectorAll('.letter-box.filled');
    expect(filledBoxes.length).toBe(3); // Only A, T, E
  });

  it('prevents clicking disabled letter buttons', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        game_id: 'test-game-123',
      },
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '⬛⬛⬛⬛⬛', // All black
        correct: false,
        target: 'stale',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    // Submit guess with all black letters - use word from list
    await userEvent.keyboard('SPLIT');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThan(0);
    });

    // Wait for disabled letters state to be set
    await waitFor(() => {
      const sButton = screen.getByRole('button', { name: 'S' });
      expect(sButton).toBeDisabled();
    });

    // Try to click disabled buttons
    const sButton = screen.getByRole('button', { name: 'S' });
    const pButton = screen.getByRole('button', { name: 'P' });

    expect(sButton).toBeDisabled();
    expect(pButton).toBeDisabled();

    // Click should not add letters
    await userEvent.click(sButton);
    await userEvent.click(pButton);

    const filledBoxes = document.querySelectorAll('.letter-box.filled');
    expect(filledBoxes.length).toBe(0); // No letters typed
  });

  it('resets disabled letters when starting new game', async () => {
    // Initial game creation
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        game_id: 'test-game-123',
      },
    });

    // Guess response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '⬛⬛⬛⬛⬛',
        correct: false,
        target: 'stale',
      },
    });

    // New game creation
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        game_id: 'test-game-new',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    // Submit a guess
    await userEvent.keyboard('CRANE');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThan(1); // Current guess row + empty row
    });

    // Wait for disabled letters to be set
    await waitFor(() => {
      const cButton = screen.getByRole('button', { name: 'C' });
      expect(cButton).toBeDisabled();
    });

    // Verify letters are disabled
    const cButton = screen.getByRole('button', { name: 'C' });
    expect(cButton).toBeDisabled();

    // Click New Game
    const newGameButton = screen.getByRole('button', { name: /new game/i });
    await userEvent.click(newGameButton);

    await waitFor(() => {
      // Wait for new game to start
      expect(mockedAxios.post).toHaveBeenCalledTimes(3); // Initial + guess + new game
    });

    // Verify C button is now enabled again
    await waitFor(() => {
      const cButtonAfterReset = screen.getByRole('button', { name: 'C' });
      expect(cButtonAfterReset).not.toBeDisabled();
    });
  });

  it('handles multiple guesses with accumulating disabled letters', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        game_id: 'test-game-123',
      },
    });

    // First guess: C and R are black
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '⬛⬛🟨🟩🟩',
        correct: false,
        target: 'stale',
      },
    });

    // Second guess: F and O are black
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '⬛⬛⬛⬛⬛',
        correct: false,
        target: 'stale',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    // First guess
    await userEvent.keyboard('CRANE');
    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThanOrEqual(1);
    });

    // Wait for disabled letters to be set
    await waitFor(() => {
      const cButton = screen.getByRole('button', { name: 'C' });
      expect(cButton).toBeDisabled();
    });

    // Verify C and R are disabled
    let cButton = screen.getByRole('button', { name: 'C' });
    let rButton = screen.getByRole('button', { name: 'R' });
    expect(cButton).toBeDisabled();
    expect(rButton).toBeDisabled();

    // Second guess - use FOUND (valid word from list)
    await userEvent.keyboard('FOUND');
    await userEvent.click(submitButton);

    await waitFor(() => {
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThanOrEqual(2);
    });

    // Wait for new disabled letters to be added
    await waitFor(() => {
      const fButton = screen.getByRole('button', { name: 'F' });
      expect(fButton).toBeDisabled();
    });

    // Verify F, O, U, N, D are now also disabled (in addition to C and R)
    const fButton = screen.getByRole('button', { name: 'F' });
    const oButton = screen.getByRole('button', { name: 'O' });
    cButton = screen.getByRole('button', { name: 'C' });
    rButton = screen.getByRole('button', { name: 'R' });

    expect(fButton).toBeDisabled();
    expect(oButton).toBeDisabled();
    expect(cButton).toBeDisabled(); // Still disabled from first guess
    expect(rButton).toBeDisabled(); // Still disabled from first guess
  });

  it('does not disable letter when one instance is black but another is green/yellow', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        game_id: 'test-game-123',
      },
    });

    // Simulate guess with duplicate letters where one is green and one is black
    // Use a real word from cache: APPLE -> target STALE
    // Result: A=yellow, P=black, P=black, L=yellow, E=green
    // So P should be disabled (both black), but A and E should not be disabled
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '🟨⬛⬛🟨🟩', // A=yellow, P=black, P=black, L=yellow, E=green
        correct: false,
        target: 'stale',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    // Type APPLE (has duplicate P)
    await userEvent.keyboard('APPLE');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThan(0);
    });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 1600));

    // Verify: P should be disabled (both instances black), but A and E should NOT be disabled
    const pButton = screen.getByRole('button', { name: 'P' });
    const aButton = screen.getByRole('button', { name: 'A' });
    const eButton = screen.getByRole('button', { name: 'E' });
    const lButton = screen.getByRole('button', { name: 'L' });

    expect(pButton).toBeDisabled(); // Both P instances are black
    expect(aButton).not.toBeDisabled(); // A is yellow
    expect(eButton).not.toBeDisabled(); // E is green
    expect(lButton).not.toBeDisabled(); // L is yellow
  });

  it('BARER vs ALTER: result ⬛🟨⬛🟩🟩 does not disable R and disables only B', async () => {
    // Start game
    mockedAxios.post.mockResolvedValueOnce({
      data: { game_id: 'test-game-123' },
    });

    // Submit guess response: BARER against ALTER -> ⬛🟨⬛🟩🟩
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        feedback: '⬛🟨⬛🟩🟩', // B=black, A=yellow, R=black, E=green, R=green
        correct: false,
        target: 'alter',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    // Type BARER (from cached list)
    await userEvent.keyboard('BARER');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      const guessRows = document.querySelectorAll('.guess-row');
      expect(guessRows.length).toBeGreaterThan(0);
    });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 1600));

    // R should NOT be disabled because one R is green
    const rButton = screen.getByRole('button', { name: 'R' });
    expect(rButton).not.toBeDisabled();

    // Count disabled keys - should be exactly 1 (only B is black-only)
    const disabledKeys = document.querySelectorAll('.key.key-disabled');
    expect(disabledKeys.length).toBe(1);

    // And B should be disabled
    const bButton = screen.getByRole('button', { name: 'B' });
    expect(bButton).toBeDisabled();
  });

  it('calls onBack when back button clicked', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        game_id: 'test-game-123',
      },
    });

    render(<PracticeMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
