import DataFetchError from '@/components/ui/DataFetchError';
import { Alert, Loader, Stack } from '@mantine/core';
import { useDtdleGame } from '../hooks/use-dtdle-game';
import DailyStatsGrid from './DailyStatsGrid';
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
      <DailyStatsGrid stats={stats} />

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
