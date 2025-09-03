import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type SearchPasswordsInput, type CreatePasswordEntryInput } from '../schema';
import { searchPasswordEntries } from '../handlers/search_password_entries';

// Test data for password entries
const testEntries: CreatePasswordEntryInput[] = [
  {
    title: 'Gmail Account',
    website_url: 'https://gmail.com',
    username: 'john.doe@example.com',
    password: 'secure123',
    category: 'Email',
    notes: 'Main email account'
  },
  {
    title: 'Facebook Login',
    website_url: 'https://facebook.com',
    username: 'john_doe',
    password: 'password456',
    category: 'Social Media',
    notes: 'Personal social account'
  },
  {
    title: 'Work Database',
    website_url: 'https://db.company.com',
    username: 'admin',
    password: 'dbpass789',
    category: 'Work',
    notes: 'Production database access'
  },
  {
    title: 'Netflix',
    website_url: 'https://netflix.com',
    username: 'family@example.com',
    password: 'streaming123',
    category: 'Entertainment',
    notes: null
  },
  {
    title: 'GitHub Repository',
    website_url: null,
    username: 'developer',
    password: 'gittoken456',
    category: 'Work',
    notes: 'Source code repository'
  }
];

describe('searchPasswordEntries', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    for (const entry of testEntries) {
      await db.insert(passwordEntriesTable)
        .values({
          title: entry.title,
          website_url: entry.website_url,
          username: entry.username,
          password: entry.password,
          category: entry.category,
          notes: entry.notes
        })
        .execute();
    }
  });

  afterEach(resetDB);

  it('should return all entries when no filters provided', async () => {
    const input: SearchPasswordsInput = {};
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(5);
    
    // Verify results are ordered by updated_at desc
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].updated_at >= result[i + 1].updated_at).toBe(true);
    }
  });

  it('should search by title case-insensitively', async () => {
    const input: SearchPasswordsInput = { query: 'gmail' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Gmail Account');
    expect(result[0].username).toBe('john.doe@example.com');
    expect(result[0].category).toBe('Email');
  });

  it('should search by website URL case-insensitively', async () => {
    const input: SearchPasswordsInput = { query: 'FACEBOOK' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Facebook Login');
    expect(result[0].website_url).toBe('https://facebook.com');
  });

  it('should search by username case-insensitively', async () => {
    const input: SearchPasswordsInput = { query: 'admin' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Work Database');
    expect(result[0].username).toBe('admin');
    expect(result[0].category).toBe('Work');
  });

  it('should search by notes case-insensitively', async () => {
    const input: SearchPasswordsInput = { query: 'production' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Work Database');
    expect(result[0].notes).toBe('Production database access');
  });

  it('should filter by category exactly', async () => {
    const input: SearchPasswordsInput = { category: 'Work' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(2);
    expect(result.every(entry => entry.category === 'Work')).toBe(true);
    
    const titles = result.map(entry => entry.title).sort();
    expect(titles).toEqual(['GitHub Repository', 'Work Database']);
  });

  it('should combine query and category filters', async () => {
    const input: SearchPasswordsInput = { 
      query: 'database', 
      category: 'Work' 
    };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Work Database');
    expect(result[0].category).toBe('Work');
  });

  it('should return empty array when no matches found', async () => {
    const input: SearchPasswordsInput = { query: 'nonexistent' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(0);
  });

  it('should handle empty query string', async () => {
    const input: SearchPasswordsInput = { query: '' };
    const result = await searchPasswordEntries(input);

    // Empty query should return all entries
    expect(result).toHaveLength(5);
  });

  it('should handle whitespace-only query', async () => {
    const input: SearchPasswordsInput = { query: '   ' };
    const result = await searchPasswordEntries(input);

    // Whitespace-only query should return all entries
    expect(result).toHaveLength(5);
  });

  it('should handle empty category string', async () => {
    const input: SearchPasswordsInput = { category: '' };
    const result = await searchPasswordEntries(input);

    // Empty category should return all entries
    expect(result).toHaveLength(5);
  });

  it('should handle case-sensitive category filtering', async () => {
    const input: SearchPasswordsInput = { category: 'work' };
    const result = await searchPasswordEntries(input);

    // Category matching is exact, so 'work' should not match 'Work'
    expect(result).toHaveLength(0);
  });

  it('should return proper date objects for timestamps', async () => {
    const input: SearchPasswordsInput = { query: 'Gmail' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result[0].updated_at.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should search across multiple fields with partial match', async () => {
    const input: SearchPasswordsInput = { query: 'example' };
    const result = await searchPasswordEntries(input);

    // Should match both Gmail (username) and Netflix (username)
    expect(result).toHaveLength(2);
    
    const titles = result.map(entry => entry.title).sort();
    expect(titles).toEqual(['Gmail Account', 'Netflix']);
  });

  it('should handle null values in searchable fields', async () => {
    const input: SearchPasswordsInput = { query: 'GitHub' };
    const result = await searchPasswordEntries(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('GitHub Repository');
    expect(result[0].website_url).toBeNull();
    expect(result[0].notes).toBe('Source code repository');
  });
});