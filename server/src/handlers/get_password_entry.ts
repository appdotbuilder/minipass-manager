import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type PasswordEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getPasswordEntry = async (id: number): Promise<PasswordEntry | null> => {
  try {
    // Query for the password entry by ID
    const results = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, id))
      .execute();

    // Return null if not found
    if (results.length === 0) {
      return null;
    }

    const entry = results[0];
    
    // Return the password entry (no numeric fields to convert in this schema)
    return {
      id: entry.id,
      title: entry.title,
      website_url: entry.website_url,
      username: entry.username,
      password: entry.password, // Note: Password should be decrypted in a real app
      category: entry.category,
      notes: entry.notes,
      created_at: entry.created_at,
      updated_at: entry.updated_at
    };
  } catch (error) {
    console.error('Password entry retrieval failed:', error);
    throw error;
  }
};