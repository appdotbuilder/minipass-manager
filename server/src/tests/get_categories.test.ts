import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type CreatePasswordEntryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

// Sample password entries for testing
const testEntries: CreatePasswordEntryInput[] = [
  {
    title: 'Gmail',
    website_url: 'https://gmail.com',
    username: 'john@example.com',
    password: 'password123',
    category: 'Email',
    notes: 'Personal email'
  },
  {
    title: 'Work Email',
    website_url: 'https://outlook.com',
    username: 'john@company.com',
    password: 'workpass456',
    category: 'Email',
    notes: 'Work email account'
  },
  {
    title: 'Facebook',
    website_url: 'https://facebook.com',
    username: 'johndoe',
    password: 'fb_password',
    category: 'Social Media',
    notes: null
  },
  {
    title: 'Instagram',
    website_url: 'https://instagram.com',
    username: 'john_photos',
    password: 'insta_pass',
    category: 'Social Media',
    notes: 'Photo sharing'
  },
  {
    title: 'Chase Bank',
    website_url: 'https://chase.com',
    username: 'john123',
    password: 'secure_bank_pass',
    category: 'Banking',
    notes: 'Primary checking account'
  }
];

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no password entries exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
  });

  it('should return categories with counts', async () => {
    // Create test password entries
    await db.insert(passwordEntriesTable)
      .values(testEntries.map(entry => ({
        title: entry.title,
        website_url: entry.website_url || null,
        username: entry.username || null,
        password: entry.password,
        category: entry.category,
        notes: entry.notes || null
      })))
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);

    // Check Banking category
    const banking = result.find(cat => cat.name === 'Banking');
    expect(banking).toBeDefined();
    expect(banking!.count).toEqual(1);

    // Check Email category
    const email = result.find(cat => cat.name === 'Email');
    expect(email).toBeDefined();
    expect(email!.count).toEqual(2);

    // Check Social Media category
    const socialMedia = result.find(cat => cat.name === 'Social Media');
    expect(socialMedia).toBeDefined();
    expect(socialMedia!.count).toEqual(2);
  });

  it('should return categories in alphabetical order', async () => {
    // Create test password entries
    await db.insert(passwordEntriesTable)
      .values(testEntries.map(entry => ({
        title: entry.title,
        website_url: entry.website_url || null,
        username: entry.username || null,
        password: entry.password,
        category: entry.category,
        notes: entry.notes || null
      })))
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Banking');
    expect(result[1].name).toEqual('Email');
    expect(result[2].name).toEqual('Social Media');

    // Verify the entire result is sorted alphabetically
    const categoryNames = result.map(cat => cat.name);
    const sortedNames = [...categoryNames].sort();
    expect(categoryNames).toEqual(sortedNames);
  });

  it('should handle single category with multiple entries', async () => {
    // Create multiple entries with same category
    const singleCategoryEntries = [
      {
        title: 'Gmail Personal',
        website_url: 'https://gmail.com',
        username: 'personal@gmail.com',
        password: 'pass1',
        category: 'Email',
        notes: null
      },
      {
        title: 'Gmail Work',
        website_url: 'https://gmail.com',
        username: 'work@gmail.com',
        password: 'pass2',
        category: 'Email',
        notes: null
      },
      {
        title: 'Outlook',
        website_url: 'https://outlook.com',
        username: 'user@outlook.com',
        password: 'pass3',
        category: 'Email',
        notes: null
      }
    ];

    await db.insert(passwordEntriesTable)
      .values(singleCategoryEntries.map(entry => ({
        title: entry.title,
        website_url: entry.website_url,
        username: entry.username,
        password: entry.password,
        category: entry.category,
        notes: entry.notes
      })))
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Email');
    expect(result[0].count).toEqual(3);
  });

  it('should handle categories with special characters and case sensitivity', async () => {
    const specialCategoryEntries = [
      {
        title: 'Test Entry 1',
        website_url: 'https://example.com',
        username: 'user1',
        password: 'pass1',
        category: 'Work & Business',
        notes: null
      },
      {
        title: 'Test Entry 2',
        website_url: 'https://example2.com',
        username: 'user2',
        password: 'pass2',
        category: 'Personal/Family',
        notes: null
      },
      {
        title: 'Test Entry 3',
        website_url: 'https://example3.com',
        username: 'user3',
        password: 'pass3',
        category: 'Tech-Tools',
        notes: null
      }
    ];

    await db.insert(passwordEntriesTable)
      .values(specialCategoryEntries.map(entry => ({
        title: entry.title,
        website_url: entry.website_url,
        username: entry.username,
        password: entry.password,
        category: entry.category,
        notes: entry.notes
      })))
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify alphabetical ordering with special characters
    expect(result[0].name).toEqual('Personal/Family');
    expect(result[1].name).toEqual('Tech-Tools');
    expect(result[2].name).toEqual('Work & Business');

    // Verify counts
    result.forEach(category => {
      expect(category.count).toEqual(1);
    });
  });

  it('should return correct count data types', async () => {
    // Create a single entry to verify data types
    await db.insert(passwordEntriesTable)
      .values([{
        title: 'Test Entry',
        website_url: 'https://example.com',
        username: 'testuser',
        password: 'testpass',
        category: 'Test Category',
        notes: null
      }])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(typeof result[0].name).toEqual('string');
    expect(typeof result[0].count).toEqual('number');
    expect(Number.isInteger(result[0].count)).toBe(true);
    expect(result[0].count).toEqual(1);
  });
});