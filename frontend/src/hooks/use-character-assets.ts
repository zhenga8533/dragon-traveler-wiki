import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCharacterSkillIcon,
  getIllustrations,
  getTalentIcon,
  type CharacterIllustration,
} from '../assets/character';
import { getSkillIcon } from '../assets/skill';
import type { Character } from '../types/character';

interface UseCharacterAssetsResult {
  illustrations: CharacterIllustration[];
  illustrationsLoading: boolean;
  illustrationsError: string | null;
  talentIcon: string | undefined;
  skillIcons: Map<string, string>;
  setSelectedIllustration: (illustration: CharacterIllustration | null) => void;
  activeIllustration: CharacterIllustration | null;
  activeIllustrationIndex: number;
  hasMultipleIllustrations: boolean;
  showPreviousIllustration: () => void;
  showNextIllustration: () => void;
}

export function useCharacterAssets(
  character: Character | null | undefined
): UseCharacterAssetsResult {
  const [illustrations, setIllustrations] = useState<CharacterIllustration[]>(
    []
  );
  const [illustrationsLoading, setIllustrationsLoading] = useState(false);
  const [illustrationsError, setIllustrationsError] = useState<string | null>(
    null
  );
  const [selectedIllustration, setSelectedIllustration] =
    useState<CharacterIllustration | null>(null);
  const [talentIcon, setTalentIcon] = useState<string | undefined>();
  const [skillIcons, setSkillIcons] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let isCancelled = false;

    if (!character) {
      setIllustrations([]);
      setIllustrationsLoading(false);
      setIllustrationsError(null);
      setSelectedIllustration(null);
      return;
    }

    setIllustrationsLoading(true);
    setIllustrationsError(null);

    getIllustrations(character.name)
      .then((imgs) => {
        if (isCancelled) return;

        setIllustrations(imgs);
        const defaultImage =
          imgs.find((img) => img.name.toLowerCase() === 'default') ?? imgs[0];
        setSelectedIllustration(defaultImage ?? null);
      })
      .catch(() => {
        if (isCancelled) return;

        console.error(
          `Failed to load illustrations for character "${character.name}"`
        );
        setIllustrations([]);
        setIllustrationsError('Unable to load illustrations right now.');
        setSelectedIllustration(null);
      })
      .finally(() => {
        if (isCancelled) return;
        setIllustrationsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [character]);

  useEffect(() => {
    let isCancelled = false;

    if (!character) {
      setTalentIcon(undefined);
      return;
    }

    getTalentIcon(character.name)
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
  }, [character]);

  useEffect(() => {
    let isCancelled = false;

    if (!character || !character.skills) {
      setSkillIcons(new Map());
      return;
    }

    Promise.all(
      character.skills.map(async (skill): Promise<[string, string] | null> => {
        if (skill.type === 'Divine Skill') {
          const divineIcon = getSkillIcon('divinity');
          return divineIcon ? [skill.name, divineIcon] : null;
        }

        const icon = await getCharacterSkillIcon(character.name, skill.name);
        return icon ? [skill.name, icon] : null;
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
  }, [character]);

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

  const hasMultipleIllustrations = illustrations.length > 1;

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
    illustrationsLoading,
    illustrationsError,
    talentIcon,
    skillIcons,
    setSelectedIllustration,
    activeIllustration,
    activeIllustrationIndex,
    hasMultipleIllustrations,
    showPreviousIllustration,
    showNextIllustration,
  };
}
