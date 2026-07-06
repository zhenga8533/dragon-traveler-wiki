import DataFetchError from '@/components/ui/DataFetchError';
import StatCard from '@/components/ui/StatCard';
import { Alert, Loader, SimpleGrid, Stack } from '@mantine/core';
import {
  IoCheckmarkCircleOutline,
  IoFlame,
  IoTrophy,
} from 'react-icons/io5';
import { useDtdleGame } from '../hooks/useDtdleGame';
import GuessSelect from './GuessSelect';
import GuessTable from './GuessTable';

export default function ClassicMode() {
  const {
    loading,
    error,
    eligible,
    answer,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  } = useDtdleGame();

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
      ) : loading || !answer ? (
        <Loader size="sm" />
      ) : (
        <>
          {gameState.solved && (
            <Alert color="green" title="Solved!">
              Today's character was {answer.name}. Come back tomorrow for a
              new one.
            </Alert>
          )}
          <GuessSelect
            characters={eligible}
            guessedSlugs={gameState.guessedSlugs}
            onSubmitGuess={submitGuess}
            disabled={gameState.solved}
          />
          <GuessTable guesses={guessedCharacters} answer={answer} />
        </>
      )}
    </Stack>
  );
}
