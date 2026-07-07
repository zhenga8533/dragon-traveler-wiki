import DataFetchError from '@/components/ui/DataFetchError';
import StatCard from '@/components/ui/StatCard';
import { Alert, Box, Loader, SimpleGrid, Stack } from '@mantine/core';
import {
  IoCheckmarkCircleOutline,
  IoFlame,
  IoTrophy,
} from 'react-icons/io5';
import { useIllustrationGame } from '../hooks/use-illustration-game';
import GuessedCharacterList from './GuessedCharacterList';
import GuessSelect from './GuessSelect';

export default function IllustrationMode() {
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
      <SimpleGrid cols={{ base: 3 }} spacing="md">
        <StatCard
          icon={<IoCheckmarkCircleOutline size={20} />}
          title="Games Played"
          value={stats.gamesPlayed}
          color="blue"
        />
        <StatCard
          icon={<IoFlame size={20} />}
          title="Current Streak"
          value={stats.currentStreak}
          color="orange"
        />
        <StatCard
          icon={<IoTrophy size={20} />}
          title="Max Streak"
          value={stats.maxStreak}
          color="yellow"
        />
      </SimpleGrid>

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
