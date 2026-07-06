import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCharacterSkillIcon,
  getTalentIcon,
  resolveIllustrations,
  type Illustration,
} from '@/assets';
import type { Character } from '@/features/characters/types';

const EMPTY_SKILL_ICONS = new Map<string, string>();

interface UseCharacterAssetsResult {
  illustrations: Illustration[];
  talentIcon: string | undefined;
  skillIcons: Map<string, string>;
  setSelectedIllustration: (illustration: Illustration | null) => void;
  activeIllustration: Illustration | null;
  activeIllustrationIndex: number;
  hasMultipleIllustrations: boolean;
  showPreviousIllustration: () => void;
  showNextIllustration: () => void;
}

export function useCharacterAssets(
  character: Character | null | undefined,
  characterAssetKey?: string
): UseCharacterAssetsResult {
  const illustrations = useMemo(
    () =>
      character
        ? resolveIllustrations(character.slug, characterAssetKey, character.illustrations)
        : [],
    [character, characterAssetKey]
  );
  // Sentinel `null` (never a real illustrations array, even an empty one) ensures the
  // reset below also runs on the very first render, not just on later changes.
  const [illustrationsForSelection, setIllustrationsForSelection] = useState<
    Illustration[] | null
  >(null);
  const [selectedIllustration, setSelectedIllustration] =
    useState<Illustration | null>(null);
  const [talentIcon, setTalentIcon] = useState<string | undefined>();
  const [skillIcons, setSkillIcons] = useState<Map<string, string>>(new Map());

  // Reset the selection to the default illustration whenever the character (and thus
  // its illustration list) changes. Adjusted during render, per React's guidance for
  // resetting state when a value changes, rather than in an effect.
  if (illustrations !== illustrationsForSelection) {
    setIllustrationsForSelection(illustrations);
    const defaultImage =
      illustrations.find((img) => img.name.toLowerCase() === 'default') ??
      illustrations[0];
    setSelectedIllustration(defaultImage ?? null);
  }

  useEffect(() => {
    let isCancelled = false;

    if (!character) {
      return;
    }

    getTalentIcon(character.slug, characterAssetKey)
      .then((icon) => {
        if (!isCancelled) {
          setTalentIcon(icon);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          console.error(`Failed to load talent icon for "${character.name}"`);
          setTalentIcon(undefined);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [character, characterAssetKey]);

  useEffect(() => {
    let isCancelled = false;

    if (!character || !character.skills) {
      return;
    }

    Promise.all(
      character.skills.map(async (skill): Promise<[string, string] | null> => {
        const typeKey = (skill.type ?? '').replace(/ Skill$/i, '').toLowerCase();
        const icon = await getCharacterSkillIcon(
          character.slug,
          typeKey,
          characterAssetKey
        );
        return icon ? [skill.type ?? typeKey, icon] : null;
      })
    )
      .then((results) => {
        if (isCancelled) return;

        const icons = new Map<string, string>();
        for (const entry of results) {
          if (entry) {
            icons.set(entry[0], entry[1]);
          }
        }
        setSkillIcons(icons);
      })
      .catch(() => {
        if (!isCancelled) {
          console.error(`Failed to load skill icons for "${character.name}"`);
          setSkillIcons(new Map());
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [character, characterAssetKey]);

  const activeIllustration = useMemo(
    () => selectedIllustration ?? illustrations[0] ?? null,
    [selectedIllustration, illustrations]
  );

  const activeIllustrationIndex = useMemo(() => {
    if (!activeIllustration) {
      return -1;
    }

    return illustrations.findIndex(
      (illustration) => illustration.name === activeIllustration.name
    );
  }, [activeIllustration, illustrations]);

  const displayTalentIcon = character ? talentIcon : undefined;
  const displaySkillIcons =
    character && character.skills ? skillIcons : EMPTY_SKILL_ICONS;

  const showPreviousIllustration = useCallback(() => {
    if (illustrations.length === 0 || activeIllustrationIndex < 0) return;

    const nextIndex =
      (activeIllustrationIndex - 1 + illustrations.length) %
      illustrations.length;
    setSelectedIllustration(illustrations[nextIndex]);
  }, [illustrations, activeIllustrationIndex]);

  const showNextIllustration = useCallback(() => {
    if (illustrations.length === 0 || activeIllustrationIndex < 0) return;

    const nextIndex = (activeIllustrationIndex + 1) % illustrations.length;
    setSelectedIllustration(illustrations[nextIndex]);
  }, [illustrations, activeIllustrationIndex]);

  return {
    illustrations,
    talentIcon: displayTalentIcon,
    skillIcons: displaySkillIcons,
    setSelectedIllustration,
    activeIllustration,
    activeIllustrationIndex,
    hasMultipleIllustrations: illustrations.length > 1,
    showPreviousIllustration,
    showNextIllustration,
  };
}
