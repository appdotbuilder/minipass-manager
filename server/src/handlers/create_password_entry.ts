import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type CreatePasswordEntryInput, type PasswordEntry } from '../schema';

export const createPasswordEntry = async (input: CreatePasswordEntryInput): Promise<PasswordEntry> => {
  try {
    // Insert password entry record
    const result = await db.insert(passwordEntriesTable)
      .values({
        title: input.title,
        website_url: input.website_url || null,
        username: input.username || null,
        password: input.password, // Note: In production, this should be encrypted
        category: input.category,
        notes: input.notes || null
        // created_at and updated_at will be set automatically by the database
      })
      .returning()
      .execute();

    // Return the created password entry
    const passwordEntry = result[0];
    return passwordEntry;
  } catch (error) {
    console.error('Password entry creation failed:', error);
    throw error;
  }
};