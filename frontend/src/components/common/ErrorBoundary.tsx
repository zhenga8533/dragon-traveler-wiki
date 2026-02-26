import {
  Button,
  Code,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { IoAlertCircle, IoHome, IoRefresh } from 'react-icons/io5';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py={80}>
          <Stack align="center" gap="xl">
            <ThemeIcon variant="light" color="red" size={80} radius="xl">
              <IoAlertCircle size={44} />
            </ThemeIcon>

            <Stack align="center" gap="sm">
              <Title order={2}>Something went wrong</Title>
              <Text c="dimmed" ta="center" maw={360}>
                An unexpected error occurred. You can try again or head back to
                the home page.
              </Text>
            </Stack>

            {this.state.error?.message && (
              <Code block maw={420} w="100%" style={{ fontSize: 'var(--mantine-font-size-xs)' }}>
                {this.state.error.message}
              </Code>
            )}

            <Group gap="sm" justify="center">
              <Button
                onClick={() => this.setState({ hasError: false })}
                leftSection={<IoRefresh size={16} />}
                variant="light"
                color="red"
              >
                Try again
              </Button>
              <Button
                component={Link}
                to="/"
                leftSection={<IoHome size={16} />}
                variant="light"
                color="grape"
              >
                Go home
              </Button>
            </Group>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
