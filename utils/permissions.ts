// utils/permissions.ts
import type { PermissionKey, UserRole } from '../types';

export const PERMISSION_DEFS: { key: PermissionKey; label: string; description: string }[] = [
  { key: 'manage_tenants', label: 'Manage Tenants', description: 'Create, update, and delete tenant (school) records' },
  { key: 'manage_users', label: 'Manage Users', description: 'Create and remove platform users and assign roles' },
  { key: 'manage_platform_settings', label: 'Platform Settings', description: 'Change global platform configuration' },
  { key: 'manage_payments', label: 'Manage Payments', description: 'Configure payment gateways and billing' },
  { key: 'manage_integrations', label: 'Integrations', description: 'Configure third-party integrations and APIs' },
  { key: 'manage_security', label: 'Security Center', description: 'Run checks and update security settings' },
  { key: 'manage_plugins', label: 'Plugins', description: 'Install, enable, disable plugins' },
  { key: 'manage_content', label: 'Manage Content', description: 'Create and edit pages, posts, and media' },
  { key: 'publish_content', label: 'Publish Content', description: 'Publish and unpublish content' },
  { key: 'send_broadcasts', label: 'Send Broadcasts', description: 'Send platform-wide announcements' },
  { key: 'view_reports', label: 'View Reports', description: 'Access analytics and reports' },
];

const allTrue = (keys: PermissionKey[]) => keys.reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<PermissionKey, boolean>);

export const DEFAULT_ROLE_PRESETS: Record<UserRole, Partial<Record<PermissionKey, boolean>>> = {
  'Super Admin': allTrue(PERMISSION_DEFS.map(p => p.key as PermissionKey)),
  'Admin': {
    manage_tenants: true,
    manage_users: true,
    manage_platform_settings: true,
    manage_payments: true,
    manage_integrations: true,
    send_broadcasts: true,
    view_reports: true,
  },
  'Editor': { manage_content: true, publish_content: true, view_reports: true },
  'Author': { manage_content: true },
  'Content Manager': { manage_content: true, publish_content: true },
  'Moderator': { manage_content: true },
  'Support': { view_reports: true, send_broadcasts: true },
  'Bursar': { manage_payments: true, view_reports: true },
  'Teacher': { view_reports: true },
  'Student': {},
  'Parent': {},
};

export const hasPlatformPermission = (
  settings: any,
  role: string | UserRole,
  key: PermissionKey
): boolean => {
  const map = (settings?.role_permissions || {}) as Record<string, Record<string, boolean>>;
  return !!(map?.[role]?.[key]);
};
