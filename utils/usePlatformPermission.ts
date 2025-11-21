// utils/usePlatformPermission.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { apiGetPlatformSettings } from '../services/api';
import { hasPlatformPermission } from './permissions';
import type { PermissionKey } from '../types';

export function usePlatformPermission() {
  const [role, setRole] = useState<string>('Super Admin');
  const [settings, setSettings] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const roleName = user?.user_metadata?.platform_role || user?.user_metadata?.role || 'Super Admin';
        if (mounted) setRole(roleName);
      } catch (error) {
        console.warn('Failed to get user platform role:', error.message);
        if (mounted) setRole('Super Admin'); // Fallback to default role
      }
      try {
        const s = await apiGetPlatformSettings();
        if (mounted) setSettings(s);
      } catch (error) {
        console.warn('Failed to get platform settings:', error.message);
        if (mounted) setSettings({}); // Fallback to empty settings
      }
      if (mounted) setLoaded(true);
    })();
    return () => { mounted = false; };
  }, []);

  const isSuper = role === 'Super Admin';
  const can = (key: PermissionKey) => isSuper || hasPlatformPermission(settings, role, key);

  return { can, role, isSuper, settings, loaded } as const;
}
