import { Alert, Card, Container, Loader, SimpleGrid, Stack } from '@mantine/core';
import {
  IoCheckmarkCircleOutline,
  IoFlame,
  IoGameControllerOutline,
  IoTrophy,
} from 'react-icons/io5';
import DataFetchError from '@/components/ui/DataFetchError';
import StatCard from '@/components/ui/StatCard';
import GuessSelect from '@/features/dtdle/components/GuessSelect';
import GuessTable from '@/features/dtdle/components/GuessTable';
import { useDtdleGame } from '@/features/dtdle/hooks/useDtdleGame';
import GuideHeroCard from './components/GuideHeroCard';

export default function Dtdle() {
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
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <GuideHeroCard
          icon={<IoGameControllerOutline size={24} />}
          title="DTdle"
          subtitle="Guess today's mystery character. One character a day, unlimited guesses."
        >
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
        </GuideHeroCard>

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
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
                    Today's character was {answer.name}. Come back tomorrow
                    for a new one.
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
        </Card>
      </Stack>
    </Container>
  );
}
