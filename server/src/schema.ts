import { z } from 'zod';

// Password entry schema
export const passwordEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  website_url: z.string().nullable(),
  username: z.string().nullable(),
  password: z.string(),
  category: z.string(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PasswordEntry = z.infer<typeof passwordEntrySchema>;

// Input schema for creating password entries
export const createPasswordEntryInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  website_url: z.string().url().nullable().optional(),
  username: z.string().nullable().optional(),
  password: z.string().min(1, "Password is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().nullable().optional()
});

export type CreatePasswordEntryInput = z.infer<typeof createPasswordEntryInputSchema>;

// Input schema for updating password entries
export const updatePasswordEntryInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  website_url: z.string().url().nullable().optional(),
  username: z.string().nullable().optional(),
  password: z.string().min(1, "Password is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  notes: z.string().nullable().optional()
});

export type UpdatePasswordEntryInput = z.infer<typeof updatePasswordEntryInputSchema>;

// Schema for password generation
export const generatePasswordInputSchema = z.object({
  length: z.number().int().min(4).max(128).default(16),
  includeUppercase: z.boolean().default(true),
  includeLowercase: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  includeSymbols: z.boolean().default(true),
  excludeSimilar: z.boolean().default(true)
});

export type GeneratePasswordInput = z.infer<typeof generatePasswordInputSchema>;

// Schema for password generation response
export const generatedPasswordSchema = z.object({
  password: z.string(),
  strength: z.enum(['weak', 'fair', 'good', 'strong'])
});

export type GeneratedPassword = z.infer<typeof generatedPasswordSchema>;

// Schema for search input
export const searchPasswordsInputSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional()
});

export type SearchPasswordsInput = z.infer<typeof searchPasswordsInputSchema>;

// Schema for getting categories
export const categorySchema = z.object({
  name: z.string(),
  count: z.number().int()
});

export type Category = z.infer<typeof categorySchema>;

// Delete password entry input schema
export const deletePasswordEntryInputSchema = z.object({
  id: z.number()
});

export type DeletePasswordEntryInput = z.infer<typeof deletePasswordEntryInputSchema>;