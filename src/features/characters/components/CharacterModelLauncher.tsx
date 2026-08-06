import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { lazy, Suspense, useState } from 'react';
import { IoAlertCircle } from 'react-icons/io5';
import { LuBox } from 'react-icons/lu';
import { getCharacterModelAssetPath } from '@/assets';
import ErrorBoundary, {
  type ErrorFallbackRenderProps,
} from '@/components/ui/ErrorBoundary';
import { ErrorDetails } from '@/components/ui/ErrorFallback';
import { useAssetManifest } from '@/hooks/use-asset-manifest';
import { useGradientAccent } from '@/hooks';

const CharacterModelViewer = lazy(() => import('./CharacterModelViewer'));

interface CharacterModelLauncherProps {
  characterSlug: string;
  skinSlug: string | null;
}

function ModelViewerErrorFallback({
  error,
  reset,
  onClose,
}: ErrorFallbackRenderProps & { onClose: () => void }) {
  return (
    <Modal centered opened onClose={onClose} title="3D Model" size="md">
      <Alert
        role="alert"
        color="red"
        variant="light"
        title="The 3D viewer couldn't be displayed"
        icon={<IoAlertCircle aria-hidden size={18} />}
      >
        <Stack gap="sm">
          <Text c="dimmed" size="sm">
            An unexpected error occurred while opening the viewer.
          </Text>
          <ErrorDetails error={error} />
          <Group justify="flex-end">
            <Button size="xs" variant="default" onClick={onClose}>
              Close
            </Button>
            <Button size="xs" color="red" variant="light" onClick={reset}>
              Try again
            </Button>
          </Group>
        </Stack>
      </Alert>
    </Modal>
  );
}

export default function CharacterModelLauncher({
  characterSlug,
  skinSlug,
}: CharacterModelLauncherProps) {
  const { accent } = useGradientAccent();
  const manifest = useAssetManifest();
  const [viewerRequested, setViewerRequested] = useState(false);
  const metadataPath = skinSlug
    ? getCharacterModelAssetPath(characterSlug, skinSlug)
    : '';

  if (manifest.loading || !skinSlug || !manifest.data.assets[metadataPath]) {
    return null;
  }

  if (viewerRequested) {
    return (
      <ErrorBoundary
        scope="section"
        name="3D model viewer"
        resetKeys={[characterSlug, skinSlug]}
        fallback={(props) => (
          <ModelViewerErrorFallback
            {...props}
            onClose={() => setViewerRequested(false)}
          />
        )}
      >
        <Suspense
          fallback={
            <ActionIcon
              aria-label="Loading 3D model viewer"
              color={accent.primary}
              disabled
              size="sm"
              variant="subtle"
            >
              <Loader color={accent.primary} size="xs" />
            </ActionIcon>
          }
        >
          <CharacterModelViewer
            characterSlug={characterSlug}
            skinSlug={skinSlug}
            onViewerClose={() => setViewerRequested(false)}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <Tooltip label="Open 3D model">
      <ActionIcon
        aria-label="Open 3D model viewer"
        color={accent.primary}
        onClick={() => setViewerRequested(true)}
        size="sm"
        variant="subtle"
      >
        <LuBox />
      </ActionIcon>
    </Tooltip>
  );
}
