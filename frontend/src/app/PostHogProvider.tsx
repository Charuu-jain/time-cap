'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/utils/analytics';

export default function PostHogProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
