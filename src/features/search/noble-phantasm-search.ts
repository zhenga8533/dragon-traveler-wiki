interface LinkedCharacterEntity {
  character_slug?: string | null;
}

interface CharacterName {
  name: string;
}

export function addLinkedCharacterNames<T extends LinkedCharacterEntity>(
  items: readonly T[],
  characterByIdentity: ReadonlyMap<string, CharacterName>,
): Array<T & { characterName?: string }> {
  return items.map((item) => ({
    ...item,
    characterName: item.character_slug
      ? characterByIdentity.get(item.character_slug)?.name
      : undefined,
  }));
}
