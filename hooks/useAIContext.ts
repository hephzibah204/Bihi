// hooks/useAIContext.ts
// React hook to register a feature/KPI context so it is auto-included in AI calls

import { useEffect, useRef } from 'react';
import { registerFeatureContext, removeFeatureContext, FeatureContext } from '../services/aiContextRegistry';

export function useAIContext(featureKey: string, data: FeatureContext | null | undefined) {
  const keyRef = useRef(featureKey);

  useEffect(() => {
    const key = keyRef.current;
    if (data) {
      registerFeatureContext(key, data);
    } else {
      removeFeatureContext(key);
    }
    return () => {
      removeFeatureContext(key);
    };
  }, [data]);
}
