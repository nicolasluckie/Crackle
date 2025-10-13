# Web Tests

This directory contains unit tests for the Crackle web interface using Vitest and React Testing Library.

## Test Files

### `setup.ts`
Global test configuration and setup:
- Configures jsdom environment
- Adds cleanup after each test
- Mocks browser APIs (scrollIntoView, localStorage)
- Imports @testing-library/jest-dom matchers

### `MainMenu.test.tsx`
Tests for the main menu component:
- Rendering mode options
- Word list loading (cache vs API)
- Loading states and button disabling
- Error handling
- Mode transitions

### `CrackMode.test.tsx`
Tests for the Crack Wordle mode:
- Component rendering and initial state
- Physical keyboard input handling
- On-screen keyboard interactions
- Guess and result validation
- API integration and filtering
- Success/error states
- Suggestion clicking
- Reset functionality

### `wordListCache.test.ts`
Tests for the word list caching utility:
- Caching word lists to localStorage
- Retrieving cached data
- Cache expiration (7 days)
- Version validation
- Error handling for corrupted data

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YourComponent from '../components/YourComponent';

describe('YourComponent', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<YourComponent />);

    const button = screen.getByRole('button', { name: /click me/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
  });
});
```

### Best Practices

1. **Use data-testid sparingly**: Prefer semantic queries like `getByRole`, `getByText`, `getByLabelText`
2. **Wait for async operations**: Use `waitFor` for API calls and state updates
3. **Mock external dependencies**: Mock axios, external components, and browser APIs
4. **Test user behavior**: Focus on what users see and do, not implementation details
5. **Keep tests isolated**: Each test should be independent and not rely on others

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

Target coverage goals:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## CI Integration

Tests run automatically in:
- Pre-commit hooks (via `.pre-commit-config.yaml`)
- GitHub Actions CI pipeline (if configured)

## Debugging Tests

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:watch"],
  "console": "integratedTerminal"
}
```

### Command Line Debugging

```bash
# Run specific test file
npx vitest src/test/MainMenu.test.tsx

# Run tests matching pattern
npx vitest --grep "keyboard input"

# Update snapshots (if using)
npx vitest --update
```

## Common Patterns

### Mocking Axios

```typescript
vi.mock('axios');
const mockedAxios = axios as any;

mockedAxios.get.mockResolvedValue({ data: { words: [] } });
```

### Mocking LocalStorage

```typescript
beforeEach(() => {
  localStorage.clear();
});

// Set cache
localStorage.setItem('key', JSON.stringify({ data: 'value' }));
```

### Testing Keyboard Events

```typescript
// Physical keyboard
await userEvent.keyboard('CRANE');

// Special keys
await userEvent.keyboard('{Enter}');
await userEvent.keyboard('{Backspace}');
```

### Testing Async Operations

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
