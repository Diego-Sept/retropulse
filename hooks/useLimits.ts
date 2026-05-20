'use client';
import { useState, useEffect, useCallback } from 'react';
import { UsoIaResponse } from '@/types';

export function useLimits() {
  const [limits, setLimits] = useState<UsoIaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLimits = useCallback(async () => {
    try {
      const res = await fetch('/api/uso-ia');
      if (res.ok) {
        const data = await res.json();
        setLimits(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
    const interval = setInterval(fetchLimits, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchLimits]);

  return { limits, loading, refetch: fetchLimits };
}
