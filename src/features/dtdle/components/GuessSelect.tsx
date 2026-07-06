import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import { Z_INDEX } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import { Group, Select, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';

interface GuessSelectProps {
  characters: Character[];
  guessedSlugs: string[];
  onSubmitGuess: (slug: string) => void;
  disabled?: boolean;
}

export default function GuessSelect({
  characters,
  guessedSlugs,
  onSubmitGuess,
  disabled,
}: GuessSelectProps) {
  const [value, setValue] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const guessed = useMemo(() => new Set(guessedSlugs), [guessedSlugs]);

  const characterBySlug = useMemo(
    () => new Map(characters.map((c) => [c.slug, c])),
    [characters]
  );

  const data = useMemo(
    () =>
      characters
        .filter((c) => !guessed.has(c.slug))
        // Same-named characters can exist at different qualities with distinct
        // slugs, so the quality suffix disambiguates them in search results.
        .map((c) => ({ value: c.slug, label: `${c.name} (${c.quality})` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [characters, guessed]
  );

  return (
    <Select
      label="Guess a character"
      placeholder={disabled ? "You've solved today's DTdle!" : 'Type a name…'}
      data={data}
      value={value}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchable
      clearable
      disabled={disabled}
      comboboxProps={{ withinPortal: true, zIndex: Z_INDEX.TOOLTIP }}
      nothingFoundMessage="No matching characters"
      renderOption={({ option }) => {
        const character = characterBySlug.get(option.value);
        if (!character) return option.label;
        return (
          <Group gap="sm" wrap="nowrap">
            <CharacterPortrait
              name={character.name}
              assetKey={character.slug}
              size={28}
              quality={character.quality}
              borderWidth={2}
            />
            <Stack gap={0}>
              <Text size="sm">{character.name}</Text>
              <Text size="xs" c="dimmed">
                {character.quality}
              </Text>
            </Stack>
          </Group>
        );
      }}
      onChange={(slug) => {
        setValue(null);
        setSearchValue('');
        if (slug) onSubmitGuess(slug);
      }}
    />
  );
}
