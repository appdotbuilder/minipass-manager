import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { getPasswordEntry } from '../handlers/get_password_entry';
import { eq } from 'drizzle-orm';

describe('getPasswordEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a password entry by ID', async () => {
    // Create a test password entry
    const testEntry = await db.insert(passwordEntriesTable)
      .values({
        title: 'Test Login',
        website_url: 'https://example.com',
        username: 'testuser',
        password: 'testpassword123',
        category: 'work',
        notes: 'Test notes for login'
      })
      .returning()
      .execute();

    const createdEntry = testEntry[0];
    
    // Retrieve the password entry
    const result = await getPasswordEntry(createdEntry.id);

    // Validate all fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdEntry.id);
    expect(result!.title).toEqual('Test Login');
    expect(result!.website_url).toEqual('https://example.com');
    expect(result!.username).toEqual('testuser');
    expect(result!.password).toEqual('testpassword123');
    expect(result!.category).toEqual('work');
    expect(result!.notes).toEqual('Test notes for login');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create entry with minimal required fields (nullable fields as null)
    const testEntry = await db.insert(passwordEntriesTable)
      .values({
        title: 'Minimal Entry',
        website_url: null,
        username: null,
        password: 'secretpass',
        category: 'personal',
        notes: null
      })
      .returning()
      .execute();

    const createdEntry = testEntry[0];
    
    const result = await getPasswordEntry(createdEntry.id);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Entry');
    expect(result!.website_url).toBeNull();
    expect(result!.username).toBeNull();
    expect(result!.password).toEqual('secretpass');
    expect(result!.category).toEqual('personal');
    expect(result!.notes).toBeNull();
  });

  it('should return null when password entry does not exist', async () => {
    // Try to get a non-existent entry
    const result = await getPasswordEntry(99999);

    expect(result).toBeNull();
  });

  it('should verify password entry exists in database after retrieval', async () => {
    // Create test entry
    const testEntry = await db.insert(passwordEntriesTable)
      .values({
        title: 'Verification Test',
        website_url: 'https://verify.com',
        username: 'verifyuser',
        password: 'verifypass',
        category: 'test',
        notes: 'Verification notes'
      })
      .returning()
      .execute();

    const createdEntry = testEntry[0];
    
    // Get the entry through handler
    const handlerResult = await getPasswordEntry(createdEntry.id);
    
    // Verify it matches what's in the database
    const dbEntries = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, createdEntry.id))
      .execute();

    expect(dbEntries).toHaveLength(1);
    const dbEntry = dbEntries[0];
    
    expect(handlerResult!.id).toEqual(dbEntry.id);
    expect(handlerResult!.title).toEqual(dbEntry.title);
    expect(handlerResult!.website_url).toEqual(dbEntry.website_url);
    expect(handlerResult!.username).toEqual(dbEntry.username);
    expect(handlerResult!.password).toEqual(dbEntry.password);
    expect(handlerResult!.category).toEqual(dbEntry.category);
    expect(handlerResult!.notes).toEqual(dbEntry.notes);
    expect(handlerResult!.created_at.getTime()).toEqual(dbEntry.created_at.getTime());
    expect(handlerResult!.updated_at.getTime()).toEqual(dbEntry.updated_at.getTime());
  });
});