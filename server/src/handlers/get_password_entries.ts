import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type PasswordEntry } from '../schema';
import { desc } from 'drizzle-orm';

export const getPasswordEntries = async (): Promise<PasswordEntry[]> => {
  try {
    // Fetch all password entries ordered by updated_at desc
    const results = await db.select()
      .from(passwordEntriesTable)
      .orderBy(desc(passwordEntriesTable.updated_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch password entries:', error);
    throw error;
  }
};