import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type UpdatePasswordEntryInput, type PasswordEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePasswordEntry = async (input: UpdatePasswordEntryInput): Promise<PasswordEntry> => {
  try {
    // First, check if the password entry exists
    const existing = await db.select()
      .from(passwordEntriesTable)
      .where(eq(passwordEntriesTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Password entry with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof passwordEntriesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.website_url !== undefined) {
      updateData.website_url = input.website_url;
    }
    if (input.username !== undefined) {
      updateData.username = input.username;
    }
    if (input.password !== undefined) {
      updateData.password = input.password;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the password entry
    const result = await db.update(passwordEntriesTable)
      .set(updateData)
      .where(eq(passwordEntriesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Password entry update failed:', error);
    throw error;
  }
};