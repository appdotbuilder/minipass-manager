import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { getPasswordEntries } from '../handlers/get_password_entries';

describe('getPasswordEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist', async () => {
    const result = await getPasswordEntries();
    
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should return all password entries', async () => {
    // Create test password entries
    const testEntries = [
      {
        title: 'Gmail Account',
        website_url: 'https://gmail.com',
        username: 'user@gmail.com',
        password: 'secret123',
        category: 'Email',
        notes: 'Primary email account'
      },
      {
        title: 'Banking',
        website_url: 'https://bank.com',
        username: 'bankuser',
        password: 'bankpass456',
        category: 'Finance',
        notes: 'Main bank account'
      },
      {
        title: 'Social Media',
        website_url: null,
        username: 'socialuser',
        password: 'social789',
        category: 'Social',
        notes: null
      }
    ];

    await db.insert(passwordEntriesTable).values(testEntries).execute();

    const result = await getPasswordEntries();

    // Should return all entries
    expect(result.length).toBe(3);

    // Verify entry structure
    result.forEach(entry => {
      expect(entry.id).toBeDefined();
      expect(typeof entry.id).toBe('number');
      expect(entry.title).toBeDefined();
      expect(typeof entry.title).toBe('string');
      expect(entry.password).toBeDefined();
      expect(typeof entry.password).toBe('string');
      expect(entry.category).toBeDefined();
      expect(typeof entry.category).toBe('string');
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific entries exist
    const titles = result.map(entry => entry.title);
    expect(titles).toContain('Gmail Account');
    expect(titles).toContain('Banking');
    expect(titles).toContain('Social Media');
  });

  it('should return entries ordered by updated_at desc', async () => {
    // Create entries with slight delay to ensure different timestamps
    await db.insert(passwordEntriesTable).values({
      title: 'First Entry',
      website_url: 'https://first.com',
      username: 'first',
      password: 'pass1',
      category: 'Test',
      notes: 'First'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(passwordEntriesTable).values({
      title: 'Second Entry',
      website_url: 'https://second.com',
      username: 'second',
      password: 'pass2',
      category: 'Test',
      notes: 'Second'
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(passwordEntriesTable).values({
      title: 'Third Entry',
      website_url: 'https://third.com',
      username: 'third',
      password: 'pass3',
      category: 'Test',
      notes: 'Third'
    }).execute();

    const result = await getPasswordEntries();

    expect(result.length).toBe(3);
    
    // Should be ordered by updated_at desc (newest first)
    expect(result[0].title).toBe('Third Entry');
    expect(result[1].title).toBe('Second Entry');
    expect(result[2].title).toBe('First Entry');

    // Verify timestamps are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].updated_at >= result[i + 1].updated_at).toBe(true);
    }
  });

  it('should handle entries with nullable fields correctly', async () => {
    // Create entry with minimal required fields
    await db.insert(passwordEntriesTable).values({
      title: 'Minimal Entry',
      website_url: null,
      username: null,
      password: 'minimalpass',
      category: 'Minimal',
      notes: null
    }).execute();

    const result = await getPasswordEntries();

    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Minimal Entry');
    expect(result[0].website_url).toBeNull();
    expect(result[0].username).toBeNull();
    expect(result[0].password).toBe('minimalpass');
    expect(result[0].category).toBe('Minimal');
    expect(result[0].notes).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should preserve all data fields correctly', async () => {
    const testData = {
      title: 'Complete Entry',
      website_url: 'https://complete.example.com',
      username: 'completeuser',
      password: 'completepassword123',
      category: 'Complete Category',
      notes: 'This is a complete entry with all fields filled'
    };

    await db.insert(passwordEntriesTable).values(testData).execute();

    const result = await getPasswordEntries();

    expect(result.length).toBe(1);
    const entry = result[0];

    expect(entry.title).toBe(testData.title);
    expect(entry.website_url).toBe(testData.website_url);
    expect(entry.username).toBe(testData.username);
    expect(entry.password).toBe(testData.password);
    expect(entry.category).toBe(testData.category);
    expect(entry.notes).toBe(testData.notes);
  });
});