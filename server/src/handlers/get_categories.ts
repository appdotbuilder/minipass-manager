import { db } from '../db';
import { passwordEntriesTable } from '../db/schema';
import { type Category } from '../schema';
import { sql } from 'drizzle-orm';

export const getCategories = async (): Promise<Category[]> => {
  try {
    // Use SQL aggregation to get unique categories with counts
    const results = await db
      .select({
        name: passwordEntriesTable.category,
        count: sql<number>`cast(count(*) as int)`
      })
      .from(passwordEntriesTable)
      .groupBy(passwordEntriesTable.category)
      .orderBy(passwordEntriesTable.category)
      .execute();

    return results;
  } catch (error) {
    console.error('Get categories failed:', error);
    throw error;
  }
};