import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { LocalStorageAdapter } from '../src/storage/storage-adapter.js';

describe('LocalStorageAdapter', () => {
  const testDir = './test-uploads';
  const adapter = new LocalStorageAdapter(testDir);

  afterAll(async () => {
    try {
      await fs.rm(path.resolve(process.cwd(), testDir), { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('uploads, retrieves, and deletes a file correctly', async () => {
    const fileContent = Buffer.from('Test attachment data for Student OS');
    const uploadResult = await adapter.uploadFile(
      {
        buffer: fileContent,
        filename: 'notes.txt',
        mimeType: 'text/plain',
        size: fileContent.length,
      },
      'notes'
    );

    expect(uploadResult.storageKey).toContain('notes/');
    expect(uploadResult.filename).toBe('notes.txt');

    // Retrieve
    const retrieved = await adapter.getFile(uploadResult.storageKey);
    expect(retrieved.toString()).toBe('Test attachment data for Student OS');

    // Delete
    await adapter.deleteFile(uploadResult.storageKey);
  });
});
