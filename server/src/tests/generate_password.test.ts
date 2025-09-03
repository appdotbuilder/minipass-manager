import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type GeneratePasswordInput } from '../schema';
import { generatePassword } from '../handlers/generate_password';

describe('generatePassword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate password with default settings', async () => {
    const input: GeneratePasswordInput = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    };

    const result = await generatePassword(input);

    expect(result.password).toBeDefined();
    expect(result.password.length).toBe(16);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
    expect(typeof result.password).toBe('string');
  });

  it('should generate password with specified length', async () => {
    const input: GeneratePasswordInput = {
      length: 24,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    };

    const result = await generatePassword(input);

    expect(result.password.length).toBe(24);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should include uppercase letters when requested', async () => {
    const input: GeneratePasswordInput = {
      length: 12,
      includeUppercase: true,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: false,
      excludeSimilar: false
    };

    const result = await generatePassword(input);

    expect(result.password).toMatch(/[A-Z]/);
    expect(result.password).not.toMatch(/[a-z]/);
    expect(result.password).not.toMatch(/[0-9]/);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should include lowercase letters when requested', async () => {
    const input: GeneratePasswordInput = {
      length: 12,
      includeUppercase: false,
      includeLowercase: true,
      includeNumbers: false,
      includeSymbols: false,
      excludeSimilar: false
    };

    const result = await generatePassword(input);

    expect(result.password).toMatch(/[a-z]/);
    expect(result.password).not.toMatch(/[A-Z]/);
    expect(result.password).not.toMatch(/[0-9]/);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should include numbers when requested', async () => {
    const input: GeneratePasswordInput = {
      length: 12,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
      excludeSimilar: false
    };

    const result = await generatePassword(input);

    expect(result.password).toMatch(/[0-9]/);
    expect(result.password).not.toMatch(/[a-zA-Z]/);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should include symbols when requested', async () => {
    const input: GeneratePasswordInput = {
      length: 12,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: true,
      excludeSimilar: false
    };

    const result = await generatePassword(input);

    expect(result.password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    expect(result.password).not.toMatch(/[a-zA-Z0-9]/);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should exclude similar characters when requested', async () => {
    const input: GeneratePasswordInput = {
      length: 20,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      excludeSimilar: true
    };

    const result = await generatePassword(input);

    // Should not contain similar-looking characters: 0, O, 1, l, I
    expect(result.password).not.toMatch(/[0O1lI]/);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should include similar characters when not excluded', async () => {
    // Generate multiple passwords to increase chance of getting similar chars
    let foundSimilarChars = false;
    
    for (let i = 0; i < 10; i++) {
      const input: GeneratePasswordInput = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeSimilar: false
      };

      const result = await generatePassword(input);
      
      if (/[0O1lI]/.test(result.password)) {
        foundSimilarChars = true;
        break;
      }
    }

    // At least one of the generated passwords should contain similar chars
    expect(foundSimilarChars).toBe(true);
  });

  it('should generate different passwords on multiple calls', async () => {
    const input: GeneratePasswordInput = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    };

    const passwords = new Set();
    
    // Generate 10 passwords and ensure they're all unique
    for (let i = 0; i < 10; i++) {
      const result = await generatePassword(input);
      passwords.add(result.password);
    }

    expect(passwords.size).toBe(10); // All passwords should be unique
  });

  it('should ensure all required character types are present', async () => {
    const input: GeneratePasswordInput = {
      length: 8,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    };

    const result = await generatePassword(input);

    expect(result.password).toMatch(/[A-Z]/);
    expect(result.password).toMatch(/[a-z]/);
    expect(result.password).toMatch(/[0-9]/);
    expect(result.password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should calculate strength appropriately for strong passwords', async () => {
    const input: GeneratePasswordInput = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    };

    const result = await generatePassword(input);

    // With all character types and good length, should be good or strong
    expect(result.strength).toBeOneOf(['good', 'strong']);
  });

  it('should calculate strength appropriately for weak passwords', async () => {
    const input: GeneratePasswordInput = {
      length: 6,
      includeUppercase: false,
      includeLowercase: true,
      includeNumbers: false,
      includeSymbols: false,
      excludeSimilar: false
    };

    const result = await generatePassword(input);

    // Short password with limited character types should be weak or fair
    expect(result.strength).toBeOneOf(['weak', 'fair']);
  });

  it('should handle minimum length passwords', async () => {
    const input: GeneratePasswordInput = {
      length: 4,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: false
    };

    const result = await generatePassword(input);

    expect(result.password.length).toBe(4);
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });

  it('should handle maximum length passwords', async () => {
    const input: GeneratePasswordInput = {
      length: 128,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    };

    const result = await generatePassword(input);

    expect(result.password.length).toBe(128);
    expect(result.strength).toBe('strong'); // Very long passwords should always be strong
  });

  it('should throw error when no character types are selected', async () => {
    const input: GeneratePasswordInput = {
      length: 12,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: false,
      excludeSimilar: false
    };

    expect(generatePassword(input)).rejects.toThrow(/no character types selected/i);
  });

  it('should work with mixed character type selections', async () => {
    const input: GeneratePasswordInput = {
      length: 14,
      includeUppercase: true,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
      excludeSimilar: true
    };

    const result = await generatePassword(input);

    expect(result.password).toMatch(/[A-Z]/);
    expect(result.password).toMatch(/[0-9]/);
    expect(result.password).not.toMatch(/[a-z]/);
    expect(result.password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    expect(result.password).not.toMatch(/[0O1lI]/); // Should exclude similar chars
    expect(result.strength).toBeOneOf(['weak', 'fair', 'good', 'strong']);
  });
});