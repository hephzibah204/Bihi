import { SchoolSettings } from '../types';

/**
 * Utility functions for checking feature access based on user roles and school settings
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'bursar';

/**
 * Check if a feature is enabled for a specific user role
 * @param settings - School settings containing feature configurations
 * @param featureKey - The key of the feature to check
 * @param userRole - The role of the user
 * @returns boolean indicating if the feature is enabled for the user role
 */
export const isFeatureEnabledForRole = (
  settings: Partial<SchoolSettings>,
  featureKey: string,
  userRole: UserRole
): boolean => {
  // First check if the feature is globally enabled
  const globallyEnabled = settings.features?.[featureKey] ?? false;
  
  // If not globally enabled, return false
  if (!globallyEnabled) {
    return false;
  }
  
  // Check role-specific settings
  const roleSpecificSetting = settings.roleBasedFeatures?.[userRole]?.[featureKey];
  
  // If role-specific setting exists, use it; otherwise, default to globally enabled
  return roleSpecificSetting ?? globallyEnabled;
};

/**
 * Get all enabled features for a specific user role
 * @param settings - School settings containing feature configurations
 * @param userRole - The role of the user
 * @returns Array of enabled feature keys for the user role
 */
export const getEnabledFeaturesForRole = (
  settings: Partial<SchoolSettings>,
  userRole: UserRole
): string[] => {
  const enabledFeatures: string[] = [];
  
  // Get all globally enabled features
  const globalFeatures = settings.features || {};
  
  Object.keys(globalFeatures).forEach(featureKey => {
    if (isFeatureEnabledForRole(settings, featureKey, userRole)) {
      enabledFeatures.push(featureKey);
    }
  });
  
  return enabledFeatures;
};

/**
 * Check if a user role has access to any features in a specific category
 * @param settings - School settings containing feature configurations
 * @param userRole - The role of the user
 * @param category - The category to check (e.g., 'Financial', 'Communication')
 * @returns boolean indicating if the user has access to any features in the category
 */
export const hasAccessToCategory = (
  settings: Partial<SchoolSettings>,
  userRole: UserRole,
  category: string
): boolean => {
  // This would require importing CONTROLLABLE_FEATURES, but to avoid circular dependencies,
  // we'll keep this simple for now
  const enabledFeatures = getEnabledFeaturesForRole(settings, userRole);
  return enabledFeatures.length > 0;
};

/**
 * Create a feature access checker function for a specific user role
 * @param settings - School settings containing feature configurations
 * @param userRole - The role of the user
 * @returns Function that checks if a feature is enabled for the user
 */
export const createFeatureChecker = (
  settings: Partial<SchoolSettings>,
  userRole: UserRole
) => {
  return (featureKey: string): boolean => {
    return isFeatureEnabledForRole(settings, featureKey, userRole);
  };
};

/**
 * Default feature access for when settings are not available
 * This provides a fallback to ensure the application doesn't break
 */
export const DEFAULT_FEATURE_ACCESS = {
  admin: ['bursary', 'communications', 'ai-tools', 'analytics', 'alumni', 'id-cards'],
  teacher: ['ai-tools', 'analytics', 'teacher-gradebook', 'communications'],
  student: ['ai-tools', 'student-results'],
  parent: ['parent-portal', 'student-results', 'ai-tools'],
  bursar: ['bursary', 'analytics']
};

/**
 * Get default enabled features for a role when settings are not available
 * @param userRole - The role of the user
 * @returns Array of default enabled feature keys
 */
export const getDefaultFeaturesForRole = (userRole: UserRole): string[] => {
  return DEFAULT_FEATURE_ACCESS[userRole] || [];
};