import DataFetchError from '@/components/ui/DataFetchError';
import { Alert, Blockquote, Loader, Stack } from '@mantine/core';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { useQuoteGame } from '../hooks/use-quote-game';
import DailyStatsGrid from './DailyStatsGrid';
import GuessedCharacterList from './GuessedCharacterList';
import GuessSelect from './GuessSelect';

export default function QuoteMode() {
  const {
    loading,
    error,
    retry,
    eligible,
    answer,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  } = useQuoteGame();

  return (
    <Stack gap="md">
      <DailyStatsGrid stats={stats} />

      {error ? (
        <DataFetchError
          title="Could not load characters"
          message={error.message}
          onRetry={retry}
        />
      ) : loading || !answer ? (
        <Loader size="sm" />
      ) : (
        <>
          {gameState.solved && (
            <Alert color="green" title="Solved!">
              That quote belongs to {answer.name}. Come back tomorrow for a new
              one.
            </Alert>
          )}
          <Blockquote
            icon={<IoChatbubbleEllipsesOutline size={20} />}
            color="grape"
          >
            "{answer.quote}"
          </Blockquote>
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
