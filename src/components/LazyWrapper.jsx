import { Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load components with loading fallback
export const LazyCharts = lazy(() => import('./Charts'));
export const LazyAuthModal = lazy(() => import('./AuthModal'));

// Wrapper component for lazy loading with fallback
export function LazyWrapper({ children, fallback = <LoadingSpinner text="Loading..." /> }) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Higher-order component for lazy loading
export function withLazyLoading(Component, fallback) {
  return function LazyComponent(props) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner text="Loading..." />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
