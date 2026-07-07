import ClassTag from '@/components/ui/ClassTag';
import QualityIcon from '@/components/ui/QualityIcon';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character } from '@/features/characters/types';
import { Group, Stack, Text } from '@mantine/core';

interface GuessedCharacterListProps {
  guessedCharacters: Character[];
  correctSlug: string | null | undefined;
}

export default function GuessedCharacterList({
  guessedCharacters,
  correctSlug,
}: GuessedCharacterListProps) {
  if (guessedCharacters.length === 0) return null;

  return (
    <Stack gap="xs">
      {[...guessedCharacters].reverse().map((guess) => {
        const isCorrect = guess.slug === correctSlug;
        return (
          <Group
            key={guess.slug}
            gap="sm"
            wrap="nowrap"
            style={{
              border: `2px solid var(--mantine-color-${isCorrect ? 'green' : 'red'}-6)`,
              borderRadius: 'var(--mantine-radius-sm)',
              padding: 6,
            }}
          >
            <CharacterPortrait
              name={guess.name}
              assetKey={guess.slug}
              size={32}
              quality={guess.quality}
            />
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                {guess.name}
              </Text>
              <Group gap={6} align="center">
                <QualityIcon quality={guess.quality} size={14} showTooltip={false} />
                <ClassTag characterClass={guess.character_class} size="xs" />
              </Group>
            </Stack>
          </Group>
        );
      })}
    </Stack>
  );
}
