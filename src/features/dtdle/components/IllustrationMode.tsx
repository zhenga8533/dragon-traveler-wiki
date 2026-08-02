import DataFetchError from '@/components/ui/DataFetchError';
import {
  Alert,
  Badge,
  Box,
  Group,
  Loader,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useIllustrationGame } from '../hooks/use-illustration-game';
import { getPortrait } from '@/assets';
import DailyStatsGrid from './DailyStatsGrid';
import GuessedCharacterList from './GuessedCharacterList';
import GuessSelect from './GuessSelect';
import { useMemo, useState } from 'react';

export default function IllustrationMode() {
  const [skinGuess, setSkinGuess] = useState<string | null>(null);
  const {
    loading,
    error,
    retry,
    eligible,
    answer,
    illustration,
    zoomScale,
    focusPoint,
    gameState,
    stats,
    guessedCharacters,
    availableScenes,
    submitCharacterGuess,
    submitSkinGuess,
  } = useIllustrationGame();

  const skinNames = useMemo(
    () => new Map(answer?.skins.map((skin) => [skin.slug, skin.name]) ?? []),
    [answer],
  );
  const skinOptions = useMemo(
    () =>
      availableScenes.flatMap((scene) =>
        scene.skinSlug
          ? [
              {
                value: scene.skinSlug,
                label: skinNames.get(scene.skinSlug) ?? scene.name,
              },
            ]
          : [],
      ),
    [availableScenes, skinNames],
  );
  const answerSkinName = illustration?.skinSlug
    ? (skinNames.get(illustration.skinSlug) ?? illustration.name)
    : (illustration?.name ?? 'Unknown');

  return (
    <Stack gap="md">
      <DailyStatsGrid stats={stats} />

      {error ? (
        <DataFetchError
          title="Could not load characters"
          message={error.message}
          onRetry={retry}
        />
      ) : loading || !answer || !illustration ? (
        <Loader size="sm" />
      ) : (
        <>
          {gameState.solved && (
            <Alert color="green" title="Solved!">
              That's {answer.name} wearing the {answerSkinName} skin. Come back
              tomorrow for a new one.
            </Alert>
          )}

          {gameState.characterSolved && !gameState.solved && (
            <Alert color="blue" title="Character found!">
              Correct, that's {answer.name}. Now identify the skin.
            </Alert>
          )}

          <Box
            style={{
              width: '100%',
              maxWidth: 500,
              aspectRatio: '2340 / 1080',
              overflow: 'hidden',
              borderRadius: 'var(--mantine-radius-md)',
              margin: '0 auto',
            }}
          >
            <img
              src={illustration.src}
              onError={(event) => {
                const fallback = getPortrait(
                  answer.name,
                  answer.slug,
                  illustration.skinSlug,
                );
                if (
                  fallback &&
                  event.currentTarget.src !==
                    new URL(fallback, window.location.href).href
                ) {
                  event.currentTarget.src = fallback;
                }
              }}
              alt="Mystery character illustration"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${gameState.characterSolved ? 1 : zoomScale})`,
                transformOrigin: `${focusPoint.x}% ${focusPoint.y}%`,
                transition: 'transform 400ms ease',
              }}
            />
          </Box>

          {!gameState.characterSolved && (
            <GuessSelect
              characters={eligible}
              guessedSlugs={gameState.guessedSlugs}
              onSubmitGuess={submitCharacterGuess}
            />
          )}

          <GuessedCharacterList
            guessedCharacters={guessedCharacters}
            correctSlug={answer.slug}
          />

          {gameState.characterSolved && !gameState.solved && (
            <Stack gap="xs">
              <Select
                label="Guess the skin"
                placeholder="Choose a skin..."
                data={skinOptions.filter(
                  (option) =>
                    !gameState.guessedSkinSlugs.includes(option.value),
                )}
                value={skinGuess}
                onChange={(value) => {
                  setSkinGuess(null);
                  if (value) submitSkinGuess(value);
                }}
                searchable
                nothingFoundMessage="No matching skins"
              />
              {gameState.guessedSkinSlugs.length > 0 && (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Incorrect skin guesses
                  </Text>
                  <Group gap="xs">
                    {gameState.guessedSkinSlugs.map((slug) => (
                      <Badge key={slug} color="red" variant="light" tt="none">
                        {skinNames.get(slug) ?? slug}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
