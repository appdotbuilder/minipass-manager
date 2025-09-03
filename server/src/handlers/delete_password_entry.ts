import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type DeletePasswordEntryInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deletePasswordEntry = async (input: DeletePasswordEntryInput): Promise<{ success: boolean }> => {
  try {
    // Delete the password entry by ID
    const result = await db.delete(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, input.id))
      .returning()
      .execute();

    // Check if any row was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Password entry deletion failed:', error);
    throw error;
  }
};