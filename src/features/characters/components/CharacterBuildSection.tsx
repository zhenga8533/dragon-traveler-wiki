import type {
  Character,
  RecommendedGearLoadoutData,
  RecommendedSubclassEntry,
} from '@/features/characters/types';
import type { Team } from '@/features/teams/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import EmptyState from '@/components/ui/EmptyState';
import { StaticSurface } from '@/components/ui/Surface';
import { IoHourglassOutline } from 'react-icons/io5';
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
  recommendedGearLoadouts: RecommendedGearLoadoutData[];
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  linkedNoblePhantasm: NoblePhantasm | null;
  scrollToSkill: (skillName: string) => void;
  scrollToTalent: () => void;
  showInformationComingSoon?: boolean;
}

export default function CharacterPageBuildSection({
  character,
  teams,
  enableNameBasedReferences = true,
  selectedTierListName,
  tierLabel,
  tierListCharacterNote,
  statusEffects,
  recommendedGearLoadouts,
  recommendedSubclassEntries,
  linkedNoblePhantasm,
  scrollToSkill,
  scrollToTalent,
  showInformationComingSoon = false,
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

      {showInformationComingSoon && (
        <StaticSurface p="xl" radius="lg">
          <EmptyState
            icon={<IoHourglassOutline size={32} />}
            title="Character information coming soon"
            description="This preview currently includes available artwork and basic details. Skills, lore, and build information will be added when they become available."
          />
        </StaticSurface>
      )}

      <CharacterRecommendedBuildSection
        recommendedGearLoadouts={recommendedGearLoadouts}
        recommendedSubclassEntries={recommendedSubclassEntries}
        linkedNoblePhantasm={linkedNoblePhantasm}
        statusEffects={statusEffects}
      />
    </>
  );
}
