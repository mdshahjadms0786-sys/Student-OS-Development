import { describe, it, expect } from 'vitest';
import { cn } from './utils.js';
import { designTokens } from './tokens.js';

describe('UI Utils & Tokens', () => {
  it('correctly merges tailwind classnames', () => {
    const result = cn('px-2 py-1', 'bg-blue-500', 'px-4');
    expect(result).toContain('py-1');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('provides complete design token definitions', () => {
    expect(designTokens.colors.primary[500]).toBe('#3b82f6');
    expect(designTokens.zIndex.modal).toBe(1050);
  });
});
