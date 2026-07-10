import DataFetchError from '@/components/ui/DataFetchError';
import { Alert, Box, Loader, Stack } from '@mantine/core';
import { useIllustrationGame } from '../hooks/use-illustration-game';
import { getPortrait } from '@/assets';
import DailyStatsGrid from './DailyStatsGrid';
import GuessedCharacterList from './GuessedCharacterList';
import GuessSelect from './GuessSelect';
import { CharacterSkinContext } from '@/contexts';
import { useContext } from 'react';

export default function IllustrationMode() {
  const { getSelectedSkin } = useContext(CharacterSkinContext);
  const {
    loading,
    error,
    eligible,
    answer,
    illustration,
    zoomScale,
    focusPoint,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  } = useIllustrationGame();

  return (
    <Stack gap="md">
      <DailyStatsGrid stats={stats} />

      {error ? (
        <DataFetchError
          title="Could not load characters"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      ) : loading || !answer || !illustration ? (
        <Loader size="sm" />
      ) : (
        <>
          {gameState.solved && (
            <Alert color="green" title="Solved!">
              That's {answer.name}. Come back tomorrow for a new one.
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
                  getSelectedSkin(answer.slug)
                );
                if (fallback && event.currentTarget.src !== new URL(fallback, window.location.href).href) {
                  event.currentTarget.src = fallback;
                }
              }}
              alt="Mystery character illustration"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${gameState.solved ? 1 : zoomScale})`,
                transformOrigin: `${focusPoint.x}% ${focusPoint.y}%`,
                transition: 'transform 400ms ease',
              }}
            />
          </Box>

          <GuessSelect
            characters={eligible}
            guessedSlugs={gameState.guessedSlugs}
            onSubmitGuess={submitGuess}
            disabled={gameState.solved}
          />

          <GuessedCharacterList
            guessedCharacters={guessedCharacters}
            correctSlug={answer.slug}
          />
        </>
      )}
    </Stack>
  );
}
