import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type UpdatePasswordEntryInput } from '../schema';
import { updatePasswordEntry } from '../handlers/update_password_entry';
import { eq } from 'drizzle-orm';

describe('updatePasswordEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test password entry
  const createTestEntry = async () => {
    const result = await db.insert(passwordEntriesTable)
      .values({
        title: 'Original Title',
        website_url: 'https://example.com',
        username: 'original_user',
        password: 'original_password',
        category: 'Work',
        notes: 'Original notes'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update all fields of a password entry', async () => {
    const original = await createTestEntry();
    
    const updateInput: UpdatePasswordEntryInput = {
      id: original.id,
      title: 'Updated Title',
      website_url: 'https://updated.com',
      username: 'updated_user',
      password: 'updated_password',
      category: 'Personal',
      notes: 'Updated notes'
    };

    const result = await updatePasswordEntry(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(original.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.website_url).toEqual('https://updated.com');
    expect(result.username).toEqual('updated_user');
    expect(result.password).toEqual('updated_password');
    expect(result.category).toEqual('Personal');
    expect(result.notes).toEqual('Updated notes');
    expect(result.created_at).toEqual(original.created_at);
    expect(result.updated_at).not.toEqual(original.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const original = await createTestEntry();
    
    const updateInput: UpdatePasswordEntryInput = {
      id: original.id,
      title: 'Partially Updated Title',
      password: 'new_password'
    };

    const result = await updatePasswordEntry(updateInput);

    // Verify only specified fields were updated
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.password).toEqual('new_password');
    
    // Verify unchanged fields remain the same
    expect(result.website_url).toEqual(original.website_url);
    expect(result.username).toEqual(original.username);
    expect(result.category).toEqual(original.category);
    expect(result.notes).toEqual(original.notes);
    expect(result.created_at).toEqual(original.created_at);
    expect(result.updated_at).not.toEqual(original.updated_at);
  });

  it('should set nullable fields to null when explicitly provided', async () => {
    const original = await createTestEntry();
    
    const updateInput: UpdatePasswordEntryInput = {
      id: original.id,
      website_url: null,
      username: null,
      notes: null
    };

    const result = await updatePasswordEntry(updateInput);

    // Verify nullable fields were set to null
    expect(result.website_url).toBeNull();
    expect(result.username).toBeNull();
    expect(result.notes).toBeNull();
    
    // Verify non-nullable fields remain unchanged
    expect(result.title).toEqual(original.title);
    expect(result.password).toEqual(original.password);
    expect(result.category).toEqual(original.category);
  });

  it('should persist changes to database', async () => {
    const original = await createTestEntry();
    
    const updateInput: UpdatePasswordEntryInput = {
      id: original.id,
      title: 'Database Test Title',
      category: 'Updated Category'
    };

    const result = await updatePasswordEntry(updateInput);

    // Query database directly to verify persistence
    const dbEntry = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, original.id))
      .execute();

    expect(dbEntry).toHaveLength(1);
    expect(dbEntry[0].title).toEqual('Database Test Title');
    expect(dbEntry[0].category).toEqual('Updated Category');
    expect(dbEntry[0].updated_at).toEqual(result.updated_at);
  });

  it('should throw error when password entry does not exist', async () => {
    const nonExistentId = 99999;
    
    const updateInput: UpdatePasswordEntryInput = {
      id: nonExistentId,
      title: 'This should fail'
    };

    await expect(updatePasswordEntry(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update with minimal data (only id required)', async () => {
    const original = await createTestEntry();
    const originalUpdatedAt = original.updated_at;
    
    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const updateInput: UpdatePasswordEntryInput = {
      id: original.id
    };

    const result = await updatePasswordEntry(updateInput);

    // Verify all original data is preserved
    expect(result.title).toEqual(original.title);
    expect(result.website_url).toEqual(original.website_url);
    expect(result.username).toEqual(original.username);
    expect(result.password).toEqual(original.password);
    expect(result.category).toEqual(original.category);
    expect(result.notes).toEqual(original.notes);
    expect(result.created_at).toEqual(original.created_at);
    
    // Verify only updated_at changed
    expect(result.updated_at).not.toEqual(originalUpdatedAt);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle empty strings for optional fields', async () => {
    const original = await createTestEntry();
    
    const updateInput: UpdatePasswordEntryInput = {
      id: original.id,
      website_url: '',
      notes: ''
    };

    const result = await updatePasswordEntry(updateInput);

    expect(result.website_url).toEqual('');
    expect(result.notes).toEqual('');
  });
});