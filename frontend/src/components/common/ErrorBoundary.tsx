import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl">
          <Stack align="center" gap="md">
            <Title order={2}>Something went wrong</Title>
            <Text c="dimmed" ta="center">
              An unexpected error occurred on this page.
            </Text>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
