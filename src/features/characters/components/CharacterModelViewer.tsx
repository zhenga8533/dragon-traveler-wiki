import { Box, Loader, Modal, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { getCharacterModelAssetPath, getVersionedAssetUrl } from '@/assets';
import { useAssetManifest } from '@/hooks/use-asset-manifest';
import { useGradientAccent } from '@/hooks';
import {
  createAnimationProgressStore,
  type AnimationSeekRequest,
} from '../hooks/use-model-animation';
import CharacterModelControls from './CharacterModelControls';
import CharacterModelScene from './CharacterModelScene';
import {
  parseModelMetadata,
  type ModelMetadata,
} from './character-model-metadata';

interface CharacterModelViewerProps {
  characterSlug: string;
  skinSlug: string | null;
  onViewerClose: () => void;
}

function getDefaultAnimationName(metadata: ModelMetadata): string {
  return (
    metadata.animations.find((animation) => animation.default)?.name ??
    metadata.animations[0]?.name ??
    ''
  );
}

export default function CharacterModelViewer({
  characterSlug,
  skinSlug,
  onViewerClose,
}: CharacterModelViewerProps) {
  const { accent } = useGradientAccent();
  const manifest = useAssetManifest();
  const metadataPath = skinSlug
    ? getCharacterModelAssetPath(characterSlug, skinSlug)
    : '';
  const metadataEntry = manifest.data.assets[metadataPath];
  const [loadedMetadata, setLoadedMetadata] = useState<{
    path: string;
    value: ModelMetadata | null;
  }>({ path: '', value: null });
  const [metadataError, setMetadataError] = useState<{
    path: string;
    message: string;
  } | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState('');
  const [animationRun, setAnimationRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressStore] = useState(createAnimationProgressStore);
  const [seekRequest, setSeekRequest] = useState<AnimationSeekRequest | null>(
    null,
  );
  const [cameraFitRequest, setCameraFitRequest] = useState(0);

  useEffect(() => {
    if (!metadataEntry) return;
    const controller = new AbortController();
    fetch(getVersionedAssetUrl(metadataPath, metadataEntry), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(parseModelMetadata)
      .then((value) => {
        setLoadedMetadata({ path: metadataPath, value });
        setMetadataError(null);
        setPaused(false);
        progressStore.reset();
        setSeekRequest(null);
        setSelectedAnimation(getDefaultAnimationName(value));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error(`Failed to load ${metadataPath}:`, error);
        setLoadedMetadata({ path: metadataPath, value: null });
        setMetadataError({
          path: metadataPath,
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return () => controller.abort();
  }, [metadataEntry, metadataPath, progressStore]);

  const selectAnimation = useCallback(
    (animation: string) => {
      setSelectedAnimation(animation);
      setPaused(false);
      progressStore.reset();
      setSeekRequest(null);
      setAnimationRun((run) => run + 1);
    },
    [progressStore],
  );
  const handleAnimationFinished = useCallback(() => {
    const fallback = loadedMetadata.value
      ? getDefaultAnimationName(loadedMetadata.value)
      : '';
    if (fallback) selectAnimation(fallback);
  }, [loadedMetadata.value, selectAnimation]);
  const replayAnimation = useCallback(() => {
    setPaused(false);
    progressStore.seek(0);
    setSeekRequest(null);
    setAnimationRun((run) => run + 1);
  }, [progressStore]);
  const seekAnimation = useCallback(
    (time: number) => {
      setPaused(true);
      progressStore.seek(time);
      setSeekRequest({ time });
    },
    [progressStore],
  );
  const resetCamera = useCallback(
    () => setCameraFitRequest((request) => request + 1),
    [],
  );

  const metadata =
    loadedMetadata.path === metadataPath ? loadedMetadata.value : null;
  const currentMetadataError =
    metadataError?.path === metadataPath ? metadataError.message : null;
  if (manifest.loading || !skinSlug || !metadataEntry) return null;
  const rootPath = metadataPath.slice(0, metadataPath.lastIndexOf('/'));

  return (
    <Modal
      centered
      onClose={onViewerClose}
      onEnterTransitionEnd={resetCamera}
      opened
      size="xl"
      title={<Text fw={700}>3D Model</Text>}
    >
      {!metadata ? (
        <Stack align="center" justify="center" mih={440}>
          {currentMetadataError ? (
            <>
              <Text fw={600}>The model could not be loaded</Text>
              <Text c="dimmed" size="sm" ta="center">
                {currentMetadataError}
              </Text>
            </>
          ) : (
            <>
              <Loader color={accent.primary} />
              <Text c="dimmed" size="sm">
                Loading model data…
              </Text>
            </>
          )}
        </Stack>
      ) : (
        <Box style={{ overflow: 'hidden' }}>
          <CharacterModelControls
            accent={accent.primary}
            animations={metadata.animations}
            selectedAnimation={selectedAnimation}
            paused={paused}
            progressStore={progressStore}
            onAnimationChange={selectAnimation}
            onPausedChange={setPaused}
            onReplay={replayAnimation}
            onResetCamera={resetCamera}
            onSeek={seekAnimation}
          />
          <CharacterModelScene
            metadata={metadata}
            rootPath={rootPath}
            entries={manifest.data.assets}
            selectedAnimation={selectedAnimation}
            animationRun={animationRun}
            paused={paused}
            seekRequest={seekRequest}
            cameraFitRequest={cameraFitRequest}
            accent={accent.primary}
            onAnimationFinished={handleAnimationFinished}
            onProgress={progressStore.publish}
          />
        </Box>
      )}
    </Modal>
  );
}
