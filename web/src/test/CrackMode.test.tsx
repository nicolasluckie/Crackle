import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import CrackMode from '../components/CrackMode';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock gif import
vi.mock('../assets/ya-done-messed-up.gif', () => ({
  default: 'mocked-gif-url',
}));

describe('CrackMode', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Setup default cached word list
    const cachedData = {
      words: ['apple', 'crane', 'slate', 'stale', 'steal'],
      timestamp: Date.now(),
      version: '1.0',
    };
    localStorage.setItem('crackle_word_list', JSON.stringify(cachedData));
    localStorage.setItem('crackle_word_list_version', '1.0');
  });

  it('renders the component with initial state', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    expect(screen.getByText(/words remaining: 5/i)).toBeInTheDocument();
    expect(screen.getByText(/guesses made: 0/i)).toBeInTheDocument();
  });

  it('displays default suggestions initially', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('TARSE')).toBeInTheDocument();
    });

    expect(screen.getByText('SALET')).toBeInTheDocument();
    expect(screen.getByText('CRANE')).toBeInTheDocument();
  });

  it('allows typing a guess using on-screen keyboard', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Guess Keyboard')).toBeInTheDocument();
    });

    const letterBoxes = screen.getAllByTestId(/letter-box/i);
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
    expect(letterBoxes[0]).toHaveTextContent('C');
    expect(letterBoxes[4]).toHaveTextContent('E');
  });

  it('allows typing result using result keyboard', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Result Keyboard')).toBeInTheDocument();
    });

    // First type a guess
    const cButton = screen.getByRole('button', { name: 'C' });
    await userEvent.click(cButton);
    // ... type rest of CRANE

    // Then type result
    const gButton = screen.getAllByRole('button', { name: 'G' })[1]; // Result keyboard
    await userEvent.click(gButton);
  });

  it('handles physical keyboard input for guess', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    // Simulate physical keyboard typing
    await userEvent.keyboard('CRANE');

    // Verify letters appear
    const letterBoxes = screen.getAllByTestId(/letter-box/i);
    expect(letterBoxes[0]).toHaveTextContent('C');
    expect(letterBoxes[4]).toHaveTextContent('E');
  });

  it('switches to result input after 5 letters typed', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    // Type 5-letter guess
    await userEvent.keyboard('CRANE');

    // Now typing G/Y/B should fill result
    await userEvent.keyboard('G');

    const resultBoxes = screen.getAllByTestId(/result-box/i);
    expect(resultBoxes[0]).toHaveTextContent('G');
  });

  it('submits guess and filters words', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        filtered: ['crane'],
        ranked: ['crane'],
        count: 1,
      },
    });

    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    // Type guess and result
    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('GGGGG');

    // Click submit
    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/filter',
        expect.objectContaining({
          guess: 'crane',
          result: 'ggggg',
        })
      );
    });
  });

  it('displays success message when word is found', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        filtered: ['crane'],
        ranked: ['crane'],
        count: 1,
      },
    });

    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('GGGGG');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/you cracked it in 1 guess/i)).toBeInTheDocument();
      expect(screen.getByText(/the word is/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockedAxios.post.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { filtered: [], ranked: [], count: 0 } }), 100))
    );

    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('BBBBB');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    // Should show spinner
    const spinners = document.querySelectorAll('.rt-Spinner');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('validates guess length', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRA'); // Only 3 letters

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    expect(submitButton).toBeDisabled();
  });

  it('validates result length', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('GG'); // Only 2 results

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    expect(submitButton).toBeDisabled();
  });

  it('handles backspace for guess', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRAN');
    await userEvent.keyboard('{Backspace}');

    const letterBoxes = [
      screen.getByTestId('letter-box-0'),
      screen.getByTestId('letter-box-1'),
      screen.getByTestId('letter-box-2'),
      screen.getByTestId('letter-box-3'),
      screen.getByTestId('letter-box-4'),
    ];
    expect(letterBoxes[3]).toHaveTextContent(''); // Last letter removed
  });

  it('handles backspace for result', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRANE'); // Full guess
    await userEvent.keyboard('GG'); // Partial result
    await userEvent.keyboard('{Backspace}'); // Remove one result

    const resultBoxes = [
      screen.getByTestId('result-box-0'),
      screen.getByTestId('result-box-1'),
      screen.getByTestId('result-box-2'),
      screen.getByTestId('result-box-3'),
      screen.getByTestId('result-box-4'),
    ];
    expect(resultBoxes[1]).toHaveTextContent(''); // Second result removed
  });

  it('resets game when reset button clicked', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRANE');

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText(/guesses made: 0/i)).toBeInTheDocument();
    });
  });

  it('clicking suggestion fills guess field', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('CRANE')).toBeInTheDocument();
    });

    const craneButton = screen.getByText('CRANE');
    await userEvent.click(craneButton);

    const letterBoxes = [
      screen.getByTestId('letter-box-0'),
      screen.getByTestId('letter-box-1'),
      screen.getByTestId('letter-box-2'),
      screen.getByTestId('letter-box-3'),
      screen.getByTestId('letter-box-4'),
    ];
    expect(letterBoxes[0]).toHaveTextContent('C');
    expect(letterBoxes[4]).toHaveTextContent('E');
  });

  it('handles API errors gracefully', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network error'));

    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('BBBBB');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to filter words/i)).toBeInTheDocument();
    });
  });

  it('calls onBack when back button clicked', async () => {
    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('disables letters marked as black after submitting guess', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        filtered: ['stale', 'steal'],
        ranked: ['stale', 'steal'],
        count: 2,
      },
    });

    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    // Type guess "CRANE" and mark C, N, E as black (b), R as green (g), A as yellow (y)
    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('BGYBB'); // C=black, R=green, A=yellow, N=black, E=black

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    // Wait for all disabled letters (C, N, E) to be set
    await waitFor(() => {
      const cButton = screen.getByRole('button', { name: 'C' });
      const nButton = screen.getByRole('button', { name: 'N' });
      const eButton = screen.getByRole('button', { name: 'E' });
      expect(cButton).toBeDisabled();
      expect(nButton).toBeDisabled();
      expect(eButton).toBeDisabled();
    });

    // Check that C, N, E buttons are disabled and R, A are not
    const cButton = screen.getByRole('button', { name: 'C' });
    const rButton = screen.getByRole('button', { name: 'R' });
    const aButton = screen.getByRole('button', { name: 'A' });
    const nButton = screen.getByRole('button', { name: 'N' });
    const eButton = screen.getByRole('button', { name: 'E' });

    expect(cButton).toBeDisabled();
    expect(nButton).toBeDisabled();
    expect(eButton).toBeDisabled();
    expect(rButton).not.toBeDisabled(); // R was green
    expect(aButton).not.toBeDisabled(); // A was yellow
  });

  it('prevents typing disabled letters with physical keyboard', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        filtered: ['stale', 'steam', 'staff'],
        ranked: ['stale', 'steam', 'staff'],
        count: 3,
      },
    });

    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    // First guess: CRANE with C, R, N, E marked as black, A as yellow
    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('BBYBB'); // C=black, R=black, A=yellow, N=black, E=black

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    // Wait for disabled letters (C, R, N, E) to be set
    await waitFor(() => {
      const cButton = screen.getByRole('button', { name: 'C' });
      const rButton = screen.getByRole('button', { name: 'R' });
      const nButton = screen.getByRole('button', { name: 'N' });
      const eButton = screen.getByRole('button', { name: 'E' });
      expect(cButton).toBeDisabled();
      expect(rButton).toBeDisabled();
      expect(nButton).toBeDisabled();
      expect(eButton).toBeDisabled();
    });

    // Try to type C, R, A, N, E -> only A should work (others are disabled)
    await userEvent.keyboard('CRANE');

    // Should only have 'A' typed (C, R, N, E are all blocked)
    await waitFor(() => {
      const letterBox0 = screen.getByTestId('letter-box-0');
      expect(letterBox0).toHaveTextContent('A');
    });
  });

  it('resets disabled letters when reset button is clicked', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        filtered: ['stale'],
        ranked: ['stale'],
        count: 1,
      },
    });

    render(<CrackMode onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Crack Wordle')).toBeInTheDocument();
    });

    // Submit a guess with black letters
    await userEvent.keyboard('CRANE');
    await userEvent.keyboard('BBBBB');

    const submitButton = screen.getByRole('button', { name: /submit guess/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    // Verify letters are disabled
    const cButton = screen.getByRole('button', { name: 'C' });
    expect(cButton).toBeDisabled();

    // Click reset
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText(/guesses made: 0/i)).toBeInTheDocument();
    });

    // Verify C button is now enabled again
    const cButtonAfterReset = screen.getByRole('button', { name: 'C' });
    expect(cButtonAfterReset).not.toBeDisabled();
  });
});
