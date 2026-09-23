import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { App } from './App.js';
import { ThemeProvider } from './lib/theme.js';

describe('Web App Layout & Auth Views', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders login screen when unauthenticated or on #login', async () => {
    window.location.hash = '#login';

    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <App />
        </ThemeProvider>
      );
    });

    expect(screen.getByText('Welcome back')).toBeDefined();
    expect(screen.getByText('Don\'t have an account?')).toBeDefined();
  });

  it('renders register screen when navigating to #register', async () => {
    window.location.hash = '#register';

    await act(async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <App />
        </ThemeProvider>
      );
    });

    expect(screen.getByText('Create an account')).toBeDefined();
    expect(screen.getByText('Sign up to get started with Student OS')).toBeDefined();
  });
});
