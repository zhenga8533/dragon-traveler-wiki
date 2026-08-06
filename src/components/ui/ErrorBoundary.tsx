import { Component, type ErrorInfo } from 'react';
import ErrorFallback from './ErrorFallback';
import type { ErrorBoundaryProps } from './error-boundary-types';

export type {
  ErrorBoundaryProps,
  ErrorBoundaryScope,
  ErrorFallbackRenderProps,
} from './error-boundary-types';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

function resetKeysChanged(
  previous: readonly unknown[] | undefined,
  current: readonly unknown[] | undefined,
): boolean {
  if (!previous || !current || previous.length !== current.length) {
    return previous !== current;
  }

  return previous.some((value, index) => !Object.is(value, current[index]));
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const label = this.props.name ? ` in ${this.props.name}` : '';
    console.error(`Uncaught error${label}:`, error, info.componentStack);
    this.props.onError?.(error, info);
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      resetKeysChanged(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  private reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const error = this.state.error ?? new Error('Unknown rendering error');
    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return (
      <ErrorFallback
        scope={this.props.scope}
        error={error}
        title={this.props.title}
        message={this.props.message}
        onReset={this.reset}
      />
    );
  }
}
