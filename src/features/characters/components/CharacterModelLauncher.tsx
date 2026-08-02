import { ActionIcon, Loader, Tooltip } from '@mantine/core';
import { lazy, Suspense, useState } from 'react';
import { LuBox } from 'react-icons/lu';
import { getCharacterModelAssetPath } from '@/assets';
import { useAssetManifest } from '@/hooks/use-asset-manifest';
import { useGradientAccent } from '@/hooks';

const CharacterModelViewer = lazy(() => import('./CharacterModelViewer'));

interface CharacterModelLauncherProps {
  characterSlug: string;
  skinSlug: string | null;
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
