import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type CreatePasswordEntryInput } from '../schema';
import { createPasswordEntry } from '../handlers/create_password_entry';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreatePasswordEntryInput = {
  title: 'Test Password Entry',
  website_url: 'https://example.com',
  username: 'testuser@example.com',
  password: 'SecurePassword123!',
  category: 'Work',
  notes: 'Important work account credentials'
};

// Minimal test input with required fields only
const minimalInput: CreatePasswordEntryInput = {
  title: 'Minimal Entry',
  password: 'MinimalPass123',
  category: 'Personal'
};

describe('createPasswordEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a password entry with all fields', async () => {
    const result = await createPasswordEntry(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Password Entry');
    expect(result.website_url).toEqual('https://example.com');
    expect(result.username).toEqual('testuser@example.com');
    expect(result.password).toEqual('SecurePassword123!');
    expect(result.category).toEqual('Work');
    expect(result.notes).toEqual('Important work account credentials');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a password entry with minimal required fields', async () => {
    const result = await createPasswordEntry(minimalInput);

    // Basic field validation
    expect(result.title).toEqual('Minimal Entry');
    expect(result.website_url).toBeNull();
    expect(result.username).toBeNull();
    expect(result.password).toEqual('MinimalPass123');
    expect(result.category).toEqual('Personal');
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save password entry to database', async () => {
    const result = await createPasswordEntry(testInput);

    // Query using proper drizzle syntax
    const passwordEntries = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, result.id))
      .execute();

    expect(passwordEntries).toHaveLength(1);
    const savedEntry = passwordEntries[0];
    expect(savedEntry.title).toEqual('Test Password Entry');
    expect(savedEntry.website_url).toEqual('https://example.com');
    expect(savedEntry.username).toEqual('testuser@example.com');
    expect(savedEntry.password).toEqual('SecurePassword123!');
    expect(savedEntry.category).toEqual('Work');
    expect(savedEntry.notes).toEqual('Important work account credentials');
    expect(savedEntry.created_at).toBeInstanceOf(Date);
    expect(savedEntry.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls: CreatePasswordEntryInput = {
      title: 'Test Entry',
      website_url: null,
      username: null,
      password: 'TestPassword',
      category: 'Test',
      notes: null
    };

    const result = await createPasswordEntry(inputWithNulls);

    expect(result.website_url).toBeNull();
    expect(result.username).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.title).toEqual('Test Entry');
    expect(result.password).toEqual('TestPassword');
    expect(result.category).toEqual('Test');
  });

  it('should create multiple password entries with unique IDs', async () => {
    const input1: CreatePasswordEntryInput = {
      title: 'First Entry',
      password: 'Password1',
      category: 'Category1'
    };

    const input2: CreatePasswordEntryInput = {
      title: 'Second Entry',
      password: 'Password2',
      category: 'Category2'
    };

    const result1 = await createPasswordEntry(input1);
    const result2 = await createPasswordEntry(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Entry');
    expect(result2.title).toEqual('Second Entry');
    expect(result1.created_at).toBeInstanceOf(Date);
    expect(result2.created_at).toBeInstanceOf(Date);
  });

  it('should set created_at and updated_at timestamps automatically', async () => {
    const beforeCreation = new Date();
    const result = await createPasswordEntry(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle special characters in fields correctly', async () => {
    const specialInput: CreatePasswordEntryInput = {
      title: 'Entry with "quotes" & symbols',
      website_url: 'https://example.com/path?param=value&other=123',
      username: 'user+tag@domain.co.uk',
      password: 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?',
      category: 'Special & Characters',
      notes: 'Notes with\nmultiple lines\tand\ttabs'
    };

    const result = await createPasswordEntry(specialInput);

    expect(result.title).toEqual('Entry with "quotes" & symbols');
    expect(result.website_url).toEqual('https://example.com/path?param=value&other=123');
    expect(result.username).toEqual('user+tag@domain.co.uk');
    expect(result.password).toEqual('P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?');
    expect(result.category).toEqual('Special & Characters');
    expect(result.notes).toEqual('Notes with\nmultiple lines\tand\ttabs');
  });
});