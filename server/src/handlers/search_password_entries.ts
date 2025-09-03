import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type SearchPasswordsInput, type PasswordEntry } from '../schema';
import { and, or, ilike, eq, desc, sql, type SQL } from 'drizzle-orm';

export const searchPasswordEntries = async (input: SearchPasswordsInput): Promise<PasswordEntry[]> => {
  try {
    // Build base query
    let baseQuery = db.select().from(passwordEntriesTable);

    const conditions: SQL<unknown>[] = [];

    // Add query filter for case-insensitive search across multiple fields
    if (input.query && input.query.trim()) {
      const searchPattern = `%${input.query.trim()}%`;
      conditions.push(
        or(
          ilike(passwordEntriesTable.title, searchPattern),
          ilike(passwordEntriesTable.website_url, searchPattern),
          ilike(passwordEntriesTable.username, searchPattern),
          ilike(passwordEntriesTable.notes, searchPattern)
        )!
      );
    }

    // Add category filter for exact match
    if (input.category && input.category.trim()) {
      conditions.push(eq(passwordEntriesTable.category, input.category.trim()));
    }

    // Build final query with conditions
    const finalQuery = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Execute query with ordering
    const results = await finalQuery
      .orderBy(desc(passwordEntriesTable.updated_at))
      .execute();

    // Convert timestamps to proper Date objects
    return results.map(entry => ({
      ...entry,
      created_at: new Date(entry.created_at),
      updated_at: new Date(entry.updated_at)
    }));
  } catch (error) {
    console.error('Password entries search failed:', error);
    throw error;
  }
};