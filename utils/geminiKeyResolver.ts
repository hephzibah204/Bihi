/**
 * Gemini API Key Resolution Utility
 * 
 * This utility provides functions to understand and work with the Gemini API key resolution system.
 * The system supports both sitewide and school-specific API keys with proper override functionality.
 */

import { SchoolSettings } from './types';

/**
 * Determines which Gemini API key will be used for a given school
 * @param schoolSettings - The school's settings containing integrations
 * @param sitewideKey - The sitewide Gemini API key (from environment)
 * @returns The API key that will be used (school-specific or sitewide)
 */
export const resolveGeminiApiKey = (
  schoolSettings: SchoolSettings | null,
  sitewideKey: string | null
): string | null => {
  // Priority 1: School-specific Gemini API key (if set)
  if (schoolSettings?.integrations?.gemini_api_key) {
    return schoolSettings.integrations.gemini_api_key;
  }
  
  // Priority 2: Sitewide Gemini API key (fallback)
  return sitewideKey;
};

/**
 * Checks if a school has overridden the sitewide Gemini API key
 * @param schoolSettings - The school's settings containing integrations
 * @returns True if the school has set their own Gemini API key
 */
export const hasSchoolSpecificGeminiKey = (schoolSettings: SchoolSettings | null): boolean => {
  return !!(schoolSettings?.integrations?.gemini_api_key);
};

/**
 * Gets information about the current API key configuration for a school
 * @param schoolSettings - The school's settings containing integrations
 * @param sitewideKey - The sitewide Gemini API key (from environment)
 * @returns Configuration information object
 */
export const getGeminiKeyInfo = (
  schoolSettings: SchoolSettings | null,
  sitewideKey: string | null
) => {
  const hasSchoolKey = hasSchoolSpecificGeminiKey(schoolSettings);
  const effectiveKey = resolveGeminiApiKey(schoolSettings, sitewideKey);
  
  return {
    hasSchoolSpecificKey: hasSchoolKey,
    hasSitewideKey: !!sitewideKey,
    hasAnyKey: !!effectiveKey,
    keySource: hasSchoolKey ? 'school' : 'sitewide',
    isOverriding: hasSchoolKey && !!sitewideKey,
    keyMasked: effectiveKey ? `${effectiveKey.substring(0, 8)}...` : null
  };
};

/**
 * Validates that a Gemini API key has the correct format
 * @param apiKey - The API key to validate
 * @returns True if the key appears to be valid
 */
export const isValidGeminiApiKey = (apiKey: string): boolean => {
  // Basic validation for Gemini API key format
  // Gemini API keys typically start with "AIza" and are around 39 characters
  return /^AIza[A-Za-z0-9_-]{35}$/.test(apiKey);
};

/**
 * Configuration constants for Gemini API key management
 */
export const GEMINI_KEY_CONFIG = {
  MIN_LENGTH: 39,
  MAX_LENGTH: 39,
  PREFIX: 'AIza',
  VALIDATION_REGEX: /^AIza[A-Za-z0-9_-]{35}$/,
  MASK_VISIBLE_CHARS: 8
} as const;

/**
 * Error messages for Gemini API key issues
 */
export const GEMINI_KEY_ERRORS = {
  NO_KEY: 'No Gemini API key configured (neither sitewide nor school-specific)',
  INVALID_FORMAT: 'Invalid Gemini API key format. Keys should start with "AIza" and be 39 characters long',
  SCHOOL_OVERRIDE_FAILED: 'Failed to retrieve school-specific Gemini API key, using sitewide fallback',
  SITEWIDE_MISSING: 'Sitewide Gemini API key is not configured'
} as const;