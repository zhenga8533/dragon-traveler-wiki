import DataFetchError from '@/components/ui/DataFetchError';
import StatCard from '@/components/ui/StatCard';
import { STORAGE_KEY } from '@/constants/ui';
import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import {
  IoCheckmarkCircleOutline,
  IoFlame,
  IoTrophy,
} from 'react-icons/io5';
import { useAbilityGame } from '../hooks/use-ability-game';
import { useStoredToggle } from '../hooks/use-stored-toggle';
import { SKILL_TYPES } from '../modes/ability/utils';
import GuessedCharacterList from './GuessedCharacterList';
import GuessSelect from './GuessSelect';

export default function AbilityMode() {
  const {
    loading,
    error,
    eligible,
    answerCharacter,
    ability,
    iconSrc,
    rotationDeg,
    gameState,
    stats,
    guessedCharacters,
    submitCharacterGuess,
    submitCategoryGuess,
  } = useAbilityGame();

  const [grayOut, setGrayOut] = useStoredToggle(
    STORAGE_KEY.DTDLE_ABILITY_GRAYSCALE,
    true
  );
  const [rotate, setRotate] = useStoredToggle(
    STORAGE_KEY.DTDLE_ABILITY_ROTATE,
    false
  );

  const obfuscate = !gameState.characterSolved;

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
      ) : loading || !answerCharacter || !ability ? (
        <Loader size="sm" />
      ) : (
        <>
          {gameState.solved && (
            <Alert color="green" title="Solved!">
              That was {ability.name} ({ability.kind === 'talent' ? 'Talent' : ability.skillType}), belonging to{' '}
              {answerCharacter.name}. Come back tomorrow for a new one.
            </Alert>
          )}

          <Group>
            <Switch
              label="Gray out icon"
              checked={grayOut}
              onChange={(event) => setGrayOut(event.currentTarget.checked)}
            />
            <Switch
              label="Randomly rotate icon"
              checked={rotate}
              onChange={(event) => setRotate(event.currentTarget.checked)}
            />
          </Group>

          <Paper withBorder p="lg" radius="md">
            <Group justify="center">
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt="Mystery ability"
                  width={96}
                  height={96}
                  style={{
                    objectFit: 'contain',
                    filter: obfuscate && grayOut ? 'grayscale(1)' : undefined,
                    transform:
                      obfuscate && rotate ? `rotate(${rotationDeg}deg)` : undefined,
                    transition: 'filter 200ms ease, transform 200ms ease',
                  }}
                />
              ) : (
                <Loader size="sm" />
              )}
            </Group>
          </Paper>

          {!gameState.characterSolved && (
            <GuessSelect
              characters={eligible}
              guessedSlugs={gameState.guessedSlugs}
              onSubmitGuess={submitCharacterGuess}
              disabled={gameState.characterSolved}
            />
          )}

          <GuessedCharacterList
            guessedCharacters={guessedCharacters}
            correctSlug={answerCharacter.slug}
          />

          {gameState.characterSolved && ability.kind === 'skill' && !gameState.solved && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Correct! Now, which skill category is it?
              </Text>
              <Group gap="xs">
                {SKILL_TYPES.map((type) => {
                  const attempted = gameState.categoryGuesses.includes(type);
                  return (
                    <Button
                      key={type}
                      variant={attempted ? 'filled' : 'light'}
                      color={attempted ? 'red' : undefined}
                      disabled={attempted}
                      onClick={() => submitCategoryGuess(type)}
                    >
                      {type}
                    </Button>
                  );
                })}
              </Group>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
