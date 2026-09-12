// Lazy Loading Examples

import React, { Suspense, lazy } from 'react';

// Lazy loaded components
const HeavyChart = lazy(() => import('./HeavyChart'));
const AdminPanel = lazy(() => import('./AdminPanel'));

export { HeavyChart, AdminPanel };
