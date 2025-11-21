import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useGeolocationFence } from './useGeolocationFence';
import { apiGetTeacherAttendance, apiSaveTeacherAttendance } from '../services/api';

export const useTeacherPresenceWatcher = () => {
  const { user, role } = useAuth();
  const { settings } = useTenant();
  const { validate } = useGeolocationFence();
  const watchId = useRef<number | null>(null);
  const [hasPresentToday, setHasPresentToday] = useState<boolean>(false);
  const [absentSaved, setAbsentSaved] = useState<boolean>(false);
  const [outsideStartMs, setOutsideStartMs] = useState<number | null>(null);
  const [insideStartMs, setInsideStartMs] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!user || role !== 'Teacher') return;
      const rules = settings?.geofenceRules || {};
      if (!rules.autoSignoutEnabled) return;
      const ts = new Date();
      const start = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate()).toISOString();
      const end = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate(), 23, 59, 59).toISOString();
      const recs = await apiGetTeacherAttendance({ teacherId: (user as any).id, from: start, to: end });
      setHasPresentToday(!!recs.find(r => r.status === 'present'));

      if (watchId.current !== null) return;
      const signoutGraceMin = rules.signoutGraceMinutes ?? 10;
      const signinGraceMin = rules.autoSignInGraceMinutes ?? 5;
      const onPos = async (pos: GeolocationPosition) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy_m: pos.coords.accuracy ?? 0, timestamp: pos.timestamp } as any;
        const res = validate(loc, settings?.premisesGeofences || [], settings?.geofenceRules || {});
        if (res.inside) {
          setOutsideStartMs(null);
          if (rules.autoSignInEnabled && !hasPresentToday) {
            const now = Date.now();
            if (insideStartMs === null) { setInsideStartMs(now); return; }
            const dwell = now - insideStartMs;
            if (dwell >= signinGraceMin * 60_000) {
              try {
                await apiSaveTeacherAttendance({ teacherId: (user as any).id, timestamp: new Date().toISOString(), status: 'present', lat: loc.lat, lng: loc.lng, accuracy_m: loc.accuracy_m, method: 'geofence', userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined, notes: 'auto-signin' } as any);
                setHasPresentToday(true);
                setInsideStartMs(null);
              } catch {}
            }
          } else {
            setInsideStartMs(null);
          }
          return;
        }
        const now = Date.now();
        if (outsideStartMs === null) {
          setOutsideStartMs(now);
          return;
        }
        const elapsed = now - outsideStartMs;
        if (rules.autoSignoutEnabled && hasPresentToday && !absentSaved && elapsed >= signoutGraceMin * 60_000) {
          try {
            await apiSaveTeacherAttendance({ teacherId: (user as any).id, timestamp: new Date().toISOString(), status: 'absent', lat: loc.lat, lng: loc.lng, accuracy_m: loc.accuracy_m, method: 'geofence', userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined, notes: 'auto-signout' } as any);
            setAbsentSaved(true);
          } catch {}
        }
      };
      const id = navigator.geolocation.watchPosition(onPos, (error) => {
        // Log geolocation error for debugging
        console.warn('Geolocation error:', error.message, 'Code:', error.code);
        
        // Handle specific error types
        if (error.code === error.PERMISSION_DENIED) {
          console.warn('Location permission denied - teacher presence tracking disabled');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          console.warn('Location unavailable - network or GPS issue');
        } else if (error.code === error.TIMEOUT) {
          console.warn('Location request timed out');
        }
      }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 });
      watchId.current = typeof id === 'number' ? id : null;
    };
    init();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [user, role, settings, validate, outsideStartMs, insideStartMs, hasPresentToday, absentSaved]);
};