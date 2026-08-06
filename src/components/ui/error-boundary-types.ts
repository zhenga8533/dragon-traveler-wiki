import type { ErrorInfo, ReactNode } from 'react';

export type ErrorBoundaryScope = 'page' | 'section' | 'inline';

export interface ErrorFallbackRenderProps {
  error: Error;
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  scope: ErrorBoundaryScope;
  name: string;
  title?: string;
  message?: string;
  resetKeys: readonly unknown[];
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
  fallback?: (props: ErrorFallbackRenderProps) => ReactNode;
}
