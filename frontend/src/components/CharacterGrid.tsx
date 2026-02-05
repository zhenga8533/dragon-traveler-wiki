import { SimpleGrid } from '@mantine/core';
import { useMemo } from 'react';
import { QUALITY_ORDER } from '../constants/colors';
import type { Character } from '../types/character';
import CharacterCard from './CharacterCard';

interface CharacterGridProps {
  characters: Character[];
  cols?: { base?: number; xs?: number; sm?: number; md?: number };
  spacing?: number | string;
}

export default function CharacterGrid({
  characters,
  cols = { base: 4, xs: 5, sm: 6, md: 8 },
  spacing = 4
}: CharacterGridProps) {
  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      // Sort by quality first (using QUALITY_ORDER)
      const qualityIndexA = QUALITY_ORDER.indexOf(a.quality);
      const qualityIndexB = QUALITY_ORDER.indexOf(b.quality);

      if (qualityIndexA !== qualityIndexB) {
        return qualityIndexA - qualityIndexB;
      }

      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [characters]);

  return (
    <SimpleGrid cols={cols} spacing={spacing}>
      {sortedCharacters.map((char) => (
        <CharacterCard
          key={char.name}
          name={char.name}
          quality={char.quality}
        />
      ))}
    </SimpleGrid>
  );
}
