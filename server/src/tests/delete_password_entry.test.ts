import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type DeletePasswordEntryInput, type CreatePasswordEntryInput } from '../schema';
import { deletePasswordEntry } from '../handlers/delete_password_entry';
import { eq } from 'drizzle-orm';

// Test input for creating a password entry
const testCreateInput: CreatePasswordEntryInput = {
  title: 'Test Password',
  website_url: 'https://example.com',
  username: 'testuser',
  password: 'securepassword123',
  category: 'Social',
  notes: 'Test notes'
};

describe('deletePasswordEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing password entry', async () => {
    // First, create a password entry to delete
    const createResult = await db.insert(passwordEntriesTable)
      .values({
        title: testCreateInput.title,
        website_url: testCreateInput.website_url,
        username: testCreateInput.username,
        password: testCreateInput.password,
        category: testCreateInput.category,
        notes: testCreateInput.notes
      })
      .returning()
      .execute();

    const createdEntry = createResult[0];
    expect(createdEntry.id).toBeDefined();

    // Now delete the entry
    const deleteInput: DeletePasswordEntryInput = {
      id: createdEntry.id
    };

    const result = await deletePasswordEntry(deleteInput);

    // Verify the deletion was successful
    expect(result.success).toBe(true);

    // Verify the entry no longer exists in the database
    const entries = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, createdEntry.id))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent entry', async () => {
    // Try to delete an entry with an ID that doesn't exist
    const deleteInput: DeletePasswordEntryInput = {
      id: 99999
    };

    const result = await deletePasswordEntry(deleteInput);

    // Should return success: false since no entry was deleted
    expect(result.success).toBe(false);
  });

  it('should not affect other entries when deleting one entry', async () => {
    // Create two password entries
    const entry1 = await db.insert(passwordEntriesTable)
      .values({
        title: 'First Entry',
        website_url: 'https://first.com',
        username: 'user1',
        password: 'password1',
        category: 'Work',
        notes: 'First entry notes'
      })
      .returning()
      .execute();

    const entry2 = await db.insert(passwordEntriesTable)
      .values({
        title: 'Second Entry',
        website_url: 'https://second.com',
        username: 'user2',
        password: 'password2',
        category: 'Personal',
        notes: 'Second entry notes'
      })
      .returning()
      .execute();

    // Delete only the first entry
    const deleteInput: DeletePasswordEntryInput = {
      id: entry1[0].id
    };

    const result = await deletePasswordEntry(deleteInput);
    expect(result.success).toBe(true);

    // Verify first entry is deleted
    const deletedEntry = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, entry1[0].id))
      .execute();
    expect(deletedEntry).toHaveLength(0);

    // Verify second entry still exists
    const remainingEntry = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, entry2[0].id))
      .execute();
    expect(remainingEntry).toHaveLength(1);
    expect(remainingEntry[0].title).toEqual('Second Entry');
  });

  it('should handle deletion with minimal required fields only', async () => {
    // Create an entry with only required fields
    const minimalEntry = await db.insert(passwordEntriesTable)
      .values({
        title: 'Minimal Entry',
        password: 'password123',
        category: 'Test'
        // website_url, username, and notes are nullable/optional
      })
      .returning()
      .execute();

    const deleteInput: DeletePasswordEntryInput = {
      id: minimalEntry[0].id
    };

    const result = await deletePasswordEntry(deleteInput);

    expect(result.success).toBe(true);

    // Verify entry is deleted
    const deletedEntry = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, minimalEntry[0].id))
      .execute();
    expect(deletedEntry).toHaveLength(0);
  });
});