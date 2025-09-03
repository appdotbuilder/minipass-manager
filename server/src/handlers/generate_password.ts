import { type GeneratePasswordInput, type GeneratedPassword } from '../schema';

export const generatePassword = async (input: GeneratePasswordInput): Promise<GeneratedPassword> => {
  try {
    // Character sets for password generation
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Similar-looking characters to exclude if requested
    const similarChars = '0O1lI';
    
    // Build character pool based on options
    let charPool = '';
    
    if (input.includeLowercase) {
      charPool += input.excludeSimilar 
        ? lowercase.replace(/[lI]/g, '') 
        : lowercase;
    }
    
    if (input.includeUppercase) {
      charPool += input.excludeSimilar 
        ? uppercase.replace(/[OI]/g, '') 
        : uppercase;
    }
    
    if (input.includeNumbers) {
      charPool += input.excludeSimilar 
        ? numbers.replace(/[01]/g, '') 
        : numbers;
    }
    
    if (input.includeSymbols) {
      charPool += symbols;
    }
    
    // Validate that we have characters to work with
    if (charPool.length === 0) {
      throw new Error('No character types selected for password generation');
    }
    
    // Generate password
    let password = '';
    const crypto = require('crypto');
    
    for (let i = 0; i < input.length; i++) {
      const randomIndex = crypto.randomInt(0, charPool.length);
      password += charPool[randomIndex];
    }
    
    // Ensure password meets minimum requirements by including at least one character from each selected type
    password = ensureRequiredCharacters(password, input);
    
    // Calculate password strength
    const strength = calculatePasswordStrength(password, input);
    
    return {
      password,
      strength
    };
  } catch (error) {
    console.error('Password generation failed:', error);
    throw error;
  }
};

const ensureRequiredCharacters = (password: string, input: GeneratePasswordInput): string => {
  const crypto = require('crypto');
  let result = password;
  let modifications = 0;
  
  // Character sets for ensuring requirements
  const lowercase = input.excludeSimilar ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = input.excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = input.excludeSimilar ? '23456789' : '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Check and fix each required character type
  if (input.includeLowercase && !/[a-z]/.test(result)) {
    const pos = crypto.randomInt(0, result.length);
    const char = lowercase[crypto.randomInt(0, lowercase.length)];
    result = result.substring(0, pos) + char + result.substring(pos + 1);
    modifications++;
  }
  
  if (input.includeUppercase && !/[A-Z]/.test(result)) {
    const pos = crypto.randomInt(0, result.length);
    const char = uppercase[crypto.randomInt(0, uppercase.length)];
    result = result.substring(0, pos) + char + result.substring(pos + 1);
    modifications++;
  }
  
  if (input.includeNumbers && !/[0-9]/.test(result)) {
    const pos = crypto.randomInt(0, result.length);
    const char = numbers[crypto.randomInt(0, numbers.length)];
    result = result.substring(0, pos) + char + result.substring(pos + 1);
    modifications++;
  }
  
  if (input.includeSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(result)) {
    const pos = crypto.randomInt(0, result.length);
    const char = symbols[crypto.randomInt(0, symbols.length)];
    result = result.substring(0, pos) + char + result.substring(pos + 1);
    modifications++;
  }
  
  return result;
};

const calculatePasswordStrength = (password: string, input: GeneratePasswordInput): 'weak' | 'fair' | 'good' | 'strong' => {
  let score = 0;
  
  // Length scoring
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  
  // Character diversity scoring
  if (input.includeLowercase && /[a-z]/.test(password)) score += 1;
  if (input.includeUppercase && /[A-Z]/.test(password)) score += 1;
  if (input.includeNumbers && /[0-9]/.test(password)) score += 1;
  if (input.includeSymbols && /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 2;
  
  // Bonus for excluding similar characters (shows intentional security consideration)
  if (input.excludeSimilar) score += 1;
  
  // Return strength based on score
  if (score >= 7) return 'strong';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'weak';
};