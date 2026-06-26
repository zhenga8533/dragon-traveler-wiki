import type {
  ActivatedSetBonus,
  Character,
  RecommendedGearDetail,
  RecommendedSubclassEntry,
} from '@/features/characters/types';
import type { Team } from '@/features/teams/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import CharacterLoreSection from './CharacterLoreSection';
import CharacterRecommendedBuildSection from './CharacterRecommendedBuildSection';
import CharacterReferenceSection from './CharacterReferenceSection';

interface CharacterPageBuildSectionProps {
  character: Character;
  teams: Team[];
  enableNameBasedReferences?: boolean;
  selectedTierListName: string | null;
  tierLabel: string | null;
  tierListCharacterNote: string | null;
  statusEffects: StatusEffect[];
  recommendedGearDetails: RecommendedGearDetail[];
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  activatedSetBonuses: ActivatedSetBonus[];
  linkedNoblePhantasm: NoblePhantasm | null;
  scrollToSkill: (skillName: string) => void;
  scrollToTalent: () => void;
}

export default function CharacterPageBuildSection({
  character,
  teams,
  enableNameBasedReferences = true,
  selectedTierListName,
  tierLabel,
  tierListCharacterNote,
  statusEffects,
  recommendedGearDetails,
  recommendedSubclassEntries,
  activatedSetBonuses,
  linkedNoblePhantasm,
  scrollToSkill,
  scrollToTalent,
}: CharacterPageBuildSectionProps) {
  return (
    <>
      <CharacterLoreSection
        character={character}
        statusEffects={statusEffects}
        scrollToSkill={scrollToSkill}
        scrollToTalent={scrollToTalent}
      />

      <CharacterReferenceSection
        character={character}
        teams={teams}
        enableNameBasedReferences={enableNameBasedReferences}
        selectedTierListName={selectedTierListName}
        tierLabel={tierLabel}
        tierListCharacterNote={tierListCharacterNote}
      />

      <CharacterRecommendedBuildSection
        recommendedGearDetails={recommendedGearDetails}
        recommendedSubclassEntries={recommendedSubclassEntries}
        activatedSetBonuses={activatedSetBonuses}
        linkedNoblePhantasm={linkedNoblePhantasm}
        statusEffects={statusEffects}
      />
    </>
  );
}
