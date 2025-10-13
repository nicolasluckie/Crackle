import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import MainMenu from '../components/MainMenu';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock LetterGlitch component
vi.mock('../components/ReactBits/LetterGlitch', () => ({
  default: () => <div data-testid="letter-glitch">LetterGlitch</div>,
}));

// Mock DecryptedText component
vi.mock('../components/ReactBits/DecryptedText', () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe('MainMenu', () => {
  const mockOnSelectMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the main menu with mode options', () => {
    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    //expect(screen.getByText('Choose Your Mode')).toBeInTheDocument();
    expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
  });

  it('renders mode descriptions', () => {
    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    expect(
      screen.getByText('Play with an unlimited number of guesses!')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Get smart suggestions to solve the daily Wordle.')
    ).toBeInTheDocument();
  });

  it('loads word list from cache when available', async () => {
    const cachedData = {
      words: ['apple', 'banana', 'crane'],
      timestamp: Date.now(),
      version: '1.0',
    };
    localStorage.setItem('crackle_word_list', JSON.stringify(cachedData));
    localStorage.setItem('crackle_word_list_version', '1.0');

    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    const crackButton = screen.getByRole('button', { name: /crack wordle/i });
    await userEvent.click(crackButton);

    await waitFor(() => {
      expect(mockOnSelectMode).toHaveBeenCalledWith('crack');
    });

    // Should not have made an API call
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('fetches word list from API when cache is empty', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { words: ['apple', 'banana', 'crane'] },
    });

    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    const crackButton = screen.getByRole('button', { name: /crack wordle/i });
    await userEvent.click(crackButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/words');
    });
  });

  it('shows loading state when clicking Crack Wordle', async () => {
    mockedAxios.get.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { words: [] } }), 100))
    );

    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    const crackButton = screen.getByRole('button', { name: /crack wordle/i });
    await userEvent.click(crackButton);

    // Should show spinner
    const spinner = document.querySelector('.rt-Spinner');
    expect(spinner).toBeInTheDocument();

    // Wait for the promise to resolve and state to update before test ends
    await waitFor(() => {
      expect(mockOnSelectMode).toHaveBeenCalledWith('crack');
    }, { timeout: 300 });

    // Wait for any pending state updates to complete
    await waitFor(() => {
      const spinnerAfter = document.querySelector('.rt-Spinner');
      expect(spinnerAfter).not.toBeInTheDocument();
    }, { timeout: 100 });
  });

  it('transitions to practice mode immediately', async () => {
    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    const practiceButton = screen.getByRole('button', { name: /practice mode/i });
    await userEvent.click(practiceButton);

    await waitFor(() => {
      expect(mockOnSelectMode).toHaveBeenCalledWith('practice');
    });
  });

  it('disables buttons during loading', async () => {
    mockedAxios.get.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { words: [] } }), 100))
    );

    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    const crackButton = screen.getByRole('button', { name: /crack wordle/i });
    const practiceButton = screen.getByRole('button', { name: /practice mode/i });

    await userEvent.click(crackButton);

    expect(crackButton).toBeDisabled();
    expect(practiceButton).toBeDisabled();

    // Wait for async operation to complete before test ends
    await waitFor(() => {
      expect(mockOnSelectMode).toHaveBeenCalledWith('crack');
    }, { timeout: 200 });
  });

  it('still transitions on API error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(<MainMenu onSelectMode={mockOnSelectMode} />);

    const crackButton = screen.getByRole('button', { name: /crack wordle/i });
    await userEvent.click(crackButton);

    await waitFor(() => {
      expect(mockOnSelectMode).toHaveBeenCalledWith('crack');
    });
  });
});
