import { useState, useCallback } from 'react';
import type { Geofence, GeofencePoint } from '../types';

type LocationReading = {
  lat: number;
  lng: number;
  accuracy_m: number;
  timestamp: number;
};

type ValidationResult = {
  inside: boolean;
  nearest?: { name?: string; distance_m: number };
};

const toRad = (v: number) => (v * Math.PI) / 180;
const haversineMeters = (a: GeofencePoint, b: GeofencePoint) => {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const pointInPolygon = (pt: GeofencePoint, poly: GeofencePoint[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng, yi = poly[i].lat;
    const xj = poly[j].lng, yj = poly[j].lat;
    const intersect = ((yi > pt.lat) !== (yj > pt.lat)) && (pt.lng < (xj - xi) * (pt.lat - yi) / (yj - yi + 0.0000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const useGeolocationFence = () => {
  const [reading, setReading] = useState<LocationReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async (options: { timeoutMs?: number; maximumAgeMs?: number } = {}) => {
    setError(null);
    return new Promise<LocationReading | null>((resolve) => {
      if (!('geolocation' in navigator)) {
        setError('Geolocation not available');
        resolve(null);
        return;
      }
      const timeout = options.timeoutMs ?? 8000;
      const maximumAge = options.maximumAgeMs ?? 10000;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const r: LocationReading = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy ?? 0,
            timestamp: pos.timestamp,
          };
          setReading(r);
          resolve(r);
        },
        (err) => {
          setError(err.message || 'Location error');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout, maximumAge }
      );
    });
  }, []);

  const validate = useCallback(
    (loc: LocationReading | null, geofences: Geofence[] = [], rules: { minAccuracy_m?: number; graceRadius_m?: number } = {}): ValidationResult => {
      if (!loc || geofences.length === 0) return { inside: false };
      const minAcc = rules.minAccuracy_m ?? 70;
      const grace = rules.graceRadius_m ?? 0;
      if (loc.accuracy_m && loc.accuracy_m > minAcc) return { inside: false };
      let nearest: { name?: string; distance_m: number } | undefined;
      let inside = false;
      geofences.forEach((g) => {
        if (g.type === 'circle' && g.center && g.radius_m) {
          const d = haversineMeters({ lat: loc.lat, lng: loc.lng }, g.center);
          if (!nearest || d < nearest.distance_m) nearest = { name: g.name, distance_m: d };
          if (d <= (g.radius_m + grace)) inside = true;
        }
        if (g.type === 'polygon' && Array.isArray(g.polygon) && g.polygon.length >= 3) {
          const p = { lat: loc.lat, lng: loc.lng };
          const isIn = pointInPolygon(p, g.polygon);
          if (isIn) inside = true;
          let minD = Infinity;
          for (let i = 0; i < g.polygon.length; i++) {
            const d = haversineMeters(p, g.polygon[i]);
            if (d < minD) minD = d;
          }
          if (!nearest || minD < nearest.distance_m) nearest = { name: g.name, distance_m: minD };
        }
      });
      return { inside, nearest };
    },
    []
  );

  return { reading, error, capture, validate };
};

export type { LocationReading, ValidationResult };
