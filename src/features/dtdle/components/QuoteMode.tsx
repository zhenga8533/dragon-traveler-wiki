import DataFetchError from '@/components/ui/DataFetchError';
import StatCard from '@/components/ui/StatCard';
import { Alert, Blockquote, Loader, SimpleGrid, Stack } from '@mantine/core';
import {
  IoCheckmarkCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoFlame,
  IoTrophy,
} from 'react-icons/io5';
import { useQuoteGame } from '../hooks/use-quote-game';
import GuessedCharacterList from './GuessedCharacterList';
import GuessSelect from './GuessSelect';

export default function QuoteMode() {
  const {
    loading,
    error,
    eligible,
    answer,
    gameState,
    stats,
    guessedCharacters,
    submitGuess,
  } = useQuoteGame();

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
              That quote belongs to {answer.name}. Come back tomorrow for a
              new one.
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
