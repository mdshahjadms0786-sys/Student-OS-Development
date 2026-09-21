import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { App } from './App.js';
import { ThemeProvider } from './lib/theme.js';

describe('Web App Layout Foundation', () => {
  it('renders without crashing and displays header and foundation titles', async () => {
    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <App />
        </ThemeProvider>
      );
    });

    expect(screen.getByText('Student OS')).toBeDefined();
    expect(screen.getByText('Phase 0: Project Foundation')).toBeDefined();
  });
});
