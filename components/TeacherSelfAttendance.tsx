import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useGeolocationFence } from '../hooks/useGeolocationFence';
import { apiSaveTeacherAttendance } from '../services/api';

const TeacherSelfAttendance: React.FC = () => {
  const { user, role } = useAuth();
  const { settings } = useTenant();
  const { reading, error, capture, validate } = useGeolocationFence();
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'inside' | 'outside' | 'saved' | 'error'>('idle');
  const [distanceInfo, setDistanceInfo] = useState<string>('');
  const [validCaptureCount, setValidCaptureCount] = useState<number>(0);

  if (role !== 'Teacher') return null;

  const onCapture = async () => {
    setGeoStatus('locating');
    const loc = await capture();
    if (!loc) { setGeoStatus('error'); return; }
    const res = validate(loc, settings?.premisesGeofences || [], settings?.geofenceRules || {});
    if (res.nearest) setDistanceInfo(`${Math.round(res.nearest.distance_m)} m to site`);
    if (res.inside) { setValidCaptureCount(prev => prev + 1); setGeoStatus('inside'); } else { setValidCaptureCount(0); setGeoStatus('outside'); }
  };

  const signIn = async (method: 'geofence' | 'manual') => {
    if (!user) return;
    const payload: any = {
      teacherId: (user as any).id,
      timestamp: new Date().toISOString(),
      status: 'present',
      method,
      lat: reading?.lat,
      lng: reading?.lng,
      accuracy_m: reading?.accuracy_m,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      notes: method === 'geofence' ? JSON.stringify({ captures: validCaptureCount }) : undefined,
    };
    try { await apiSaveTeacherAttendance(payload); setGeoStatus('saved'); setValidCaptureCount(0); } catch { setGeoStatus('error'); }
  };

  const signOut = async (method: 'geofence' | 'manual') => {
    if (!user) return;
    const payload: any = {
      teacherId: (user as any).id,
      timestamp: new Date().toISOString(),
      status: 'absent',
      method,
      lat: reading?.lat,
      lng: reading?.lng,
      accuracy_m: reading?.accuracy_m,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      notes: method === 'geofence' ? 'self-signout' : 'manual-signout',
    };
    try { await apiSaveTeacherAttendance(payload); setGeoStatus('saved'); } catch { setGeoStatus('error'); }
  };

  const requireTwo = settings?.geofenceRules?.requireTwoCaptures ?? false;
  const allowManual = settings?.geofenceRules?.allowManualMarking ?? true;
  const geofenceRequired = settings?.geofenceRules?.geofenceRequired ?? false;

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-lg">My Attendance</h3>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className="btn" onClick={onCapture} disabled={geoStatus === 'locating'}>{geoStatus === 'locating' ? 'Locating…' : 'Capture Location'}</button>
        {reading && <span className="text-sm text-gray-600">Accuracy: {Math.round(reading.accuracy_m || 0)} m</span>}
        {distanceInfo && <span className="text-sm text-gray-600">{distanceInfo}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!geofenceRequired && allowManual && (
          <>
            <button className="btn btn-secondary" onClick={() => signIn('manual')}>Sign In Manually</button>
            <button className="btn btn-secondary" onClick={() => signOut('manual')}>Sign Out Manually</button>
          </>
        )}
        {geoStatus === 'inside' && (
          requireTwo ? (
            validCaptureCount >= 2 ? (
              <button className="btn btn-primary" onClick={() => signIn('geofence')}>Sign In</button>
            ) : (
              <span className="text-sm text-gray-600">Capture again to confirm</span>
            )
          ) : (
            <button className="btn btn-primary" onClick={() => signIn('geofence')}>Sign In</button>
          )
        )}
        {geoStatus === 'outside' && (
          <button className="btn btn-warning" onClick={() => signOut('geofence')}>Sign Out</button>
        )}
        {geoStatus === 'saved' && <span className="text-green-600 text-sm">Saved</span>}
        {geoStatus === 'error' && <span className="text-red-600 text-sm">Error</span>}
      </div>
    </div>
  );
};

export default TeacherSelfAttendance;