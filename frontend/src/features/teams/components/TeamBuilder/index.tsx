import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { STORAGE_KEY } from '@/constants/ui';
import CharacterCard from '@/features/characters/components/CharacterCard';
import FilterableCharacterPool from '@/features/characters/components/FilterableCharacterPool';
import type { Character } from '@/features/characters/types';
import {
  getCharacterBaseSlug,
  getCharacterIdentityKey,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import { BattlefieldGrid } from '@/features/teams/components/BattlefieldGrid';
import { BenchSection } from '@/features/teams/components/BenchSection';
import TeamSynergyAssistant from '@/features/teams/components/TeamSynergyAssistant';
import { useTeamBuilderState } from '@/features/teams/hooks/use-team-builder-state';
import type { Team } from '@/features/teams/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { useDarkMode, useIsMobile, useMobileTooltip } from '@/hooks';
import { toEntitySlug } from '@/utils/entity-slug';
import { downloadElementAsPng } from '@/utils/export-image';
import { buildSuggestionIssueUrls } from '@/utils/github-issues';
import { showSuccessToast, showWarningToast } from '@/utils/toast';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Box, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AvailablePool,
  BenchPool,
  DraggableCharCard,
  PasteJsonModal,
  SlotsGrid,
  TeamMetaFields,
  WyrmspellSelector,
} from './BuilderElements';
import TeamBuilderToolbar from './TeamBuilderToolbar';

interface TeamBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: Team | null;
  wyrmspells?: Wyrmspell[];
}

/* ── Main TeamBuilder ── */

export default function TeamBuilder({
  characters,
  charMap,
  initialData,
  wyrmspells = [],
}: TeamBuilderProps) {
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const [
    clearConfirmOpened,
    { open: openClearConfirm, close: closeClearConfirm },
  ] = useDisclosure(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingSaveOverwrite, setPendingSaveOverwrite] = useState<
    string | null
  >(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();
  const tooltipProps = useMobileTooltip();
  const isMobile = useIsMobile();

  const {
    activeId,
    availableCharacters,
    bench,
    benchNotes,
    characterByIdentity,
    characterNameCounts,
    factionColor,
    getCharacterFromKey,
    getCharacterPath,
    handleAddToNextSlot,
    handleAuthorCommit,
    handleBenchNoteChange,
    handleClear,
    handleContentTypeChange,
    handleDescriptionCommit,
    handleDragEnd,
    handleDragStart,
    handleFactionChange,
    handleNameCommit,
    handleOverdriveOrderChange,
    handlePasteApply,
    handleRemoveFromTeam,
    handleSlotNoteChange,
    handleWyrmspellChange,
    hasAnyBuilderData,
    json,
    meta,
    overdriveOrderBySlot,
    slotNotes,
    slots,
    synergy,
    teamData,
    teamSize,
    teamWyrmspells,
  } = useTeamBuilderState({
    characters,
    charMap,
    initialData,
    wyrmspells,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  );

  useEffect(() => {
    if (!isCapturing) return;
    const el = exportRef.current;
    if (!el) return;

    const run = async () => {
      // Brief delay so portrait images (already cached) can paint
      await new Promise((r) => setTimeout(r, 150));
      try {
        await downloadElementAsPng(el, teamData.name || 'team', isDark);
      } finally {
        setIsCapturing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapturing]);

  const { issueUrl: teamIssueUrl, emptyIssueUrl: teamEmptyIssueUrl } = useMemo(
    () =>
      buildSuggestionIssueUrls({
        title: '[Team] New team suggestion',
        json,
        entityType: 'team',
      }),
    [json]
  );

  function executeSaveToMySaved(key: string) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const normalized: Team = { ...teamData, last_updated: now };
      const stored = window.localStorage.getItem(STORAGE_KEY.TEAMS_MY_SAVED);
      const saves: Record<string, Team> = stored
        ? (JSON.parse(stored) as Record<string, Team>)
        : {};
      saves[key] = normalized;
      window.localStorage.setItem(
        STORAGE_KEY.TEAMS_MY_SAVED,
        JSON.stringify(saves)
      );
      showSuccessToast({
        title: 'Saved!',
        message: `"${key}" saved to My Saved Teams.`,
      });
    } catch {
      // ignore
    }
  }

  function handleSaveToMySaved() {
    try {
      const key = toEntitySlug(teamData.name?.trim() || 'Untitled');
      const stored = window.localStorage.getItem(STORAGE_KEY.TEAMS_MY_SAVED);
      const saves: Record<string, Team> = stored
        ? (JSON.parse(stored) as Record<string, Team>)
        : {};
      if (saves[key]) {
        setPendingSaveOverwrite(key);
        return;
      }
      executeSaveToMySaved(key);
    } catch {
      // ignore
    }
  }

  function handleSubmitSuggestion() {
    if (!teamIssueUrl) {
      window.open(teamEmptyIssueUrl, '_blank');
      showWarningToast({
        title: 'Team JSON is too large',
        message:
          'Please copy the JSON using the Copy JSON button and paste it into the GitHub issue body.',
        autoClose: 8000,
      });
      return;
    }
    window.open(teamIssueUrl, '_blank');
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Stack gap="md">
          <TeamMetaFields
            name={meta.name}
            author={meta.author}
            contentType={meta.contentType}
            faction={meta.faction}
            description={meta.description}
            onNameCommit={handleNameCommit}
            onAuthorCommit={handleAuthorCommit}
            onContentTypeChange={handleContentTypeChange}
            onFactionChange={handleFactionChange}
            onDescriptionCommit={handleDescriptionCommit}
          />

          <TeamBuilderToolbar
            json={json}
            teamSize={teamSize}
            isCapturing={isCapturing}
            hasAnyBuilderData={hasAnyBuilderData}
            onPasteOpen={openPasteModal}
            onSave={handleSaveToMySaved}
            onExport={() => setIsCapturing(true)}
            onSubmit={handleSubmitSuggestion}
            onClear={openClearConfirm}
          />

          <TeamSynergyAssistant synergy={synergy} />

          <WyrmspellSelector
            wyrmspells={wyrmspells}
            teamWyrmspells={teamWyrmspells}
            onChange={handleWyrmspellChange}
          />

          <SlotsGrid
            slots={slots}
            overdriveOrderBySlot={overdriveOrderBySlot}
            slotNotes={slotNotes}
            charMap={characterByIdentity}
            onOverdriveOrderChange={handleOverdriveOrderChange}
            onRemove={handleRemoveFromTeam}
            onNoteChange={handleSlotNoteChange}
            activeId={activeId}
            nameCounts={characterNameCounts}
          />

          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Bench
            </Text>
            <BenchPool
              bench={bench}
              charMap={characterByIdentity}
              benchNotes={benchNotes}
              onBenchNoteChange={handleBenchNoteChange}
              nameCounts={characterNameCounts}
            />
          </Stack>

          <FilterableCharacterPool characters={availableCharacters}>
            {(filtered, filterHeader, paginationControl) => (
              <AvailablePool
                filterHeader={filterHeader}
                paginationControl={paginationControl}
              >
                {filtered.map((c) => (
                  <DraggableCharCard
                    key={getCharacterIdentityKey(c)}
                    name={c.name}
                    charKey={getCharacterIdentityKey(c)}
                    char={c}
                    size={isMobile ? 56 : undefined}
                    nameCounts={characterNameCounts}
                    onClick={() =>
                      handleAddToNextSlot(getCharacterIdentityKey(c))
                    }
                  />
                ))}
              </AvailablePool>
            )}
          </FilterableCharacterPool>
        </Stack>

        {typeof document !== 'undefined'
          ? createPortal(
              <DragOverlay dropAnimation={null}>
                {activeId
                  ? (() => {
                      const activeChar = getCharacterFromKey(activeId);
                      const isDuplicate =
                        activeChar &&
                        (characterNameCounts.get(
                          getCharacterBaseSlug(activeChar.name)
                        ) ?? 1) > 1;
                      return (
                        <Box style={{ cursor: 'grabbing' }}>
                          <CharacterCard
                            name={activeChar?.name ?? activeId}
                            label={
                              isDuplicate && activeChar
                                ? `${activeChar.name} (${activeChar.quality})`
                                : undefined
                            }
                            quality={activeChar?.quality}
                            disableLink
                            routePath={
                              activeChar
                                ? getCharacterRoutePath(
                                    activeChar,
                                    characterNameCounts
                                  )
                                : undefined
                            }
                          />
                        </Box>
                      );
                    })()
                  : null}
              </DragOverlay>,
              document.body
            )
          : null}

        <PasteJsonModal
          opened={pasteModalOpened}
          onClose={closePasteModal}
          onApply={(pasteText) => {
            const errorMessage = handlePasteApply(pasteText);
            if (!errorMessage) {
              closePasteModal();
            }
            return errorMessage;
          }}
        />

        <ConfirmActionModal
          opened={clearConfirmOpened}
          onCancel={closeClearConfirm}
          title="Clear team builder?"
          message="This will remove all team slots, bench entries, notes, overdrive order, selected wyrmspells, and metadata fields (name, author, content type, faction, and description) in the builder."
          confirmLabel="Clear All"
          confirmColor="red"
          onConfirm={() => {
            handleClear();
            closeClearConfirm();
          }}
        />

        <ConfirmActionModal
          opened={pendingSaveOverwrite !== null}
          onCancel={() => setPendingSaveOverwrite(null)}
          title="Overwrite saved team?"
          message={`A saved team named "${pendingSaveOverwrite ?? ''}" already exists. Overwrite it?`}
          confirmLabel="Overwrite"
          confirmColor="blue"
          onConfirm={() => {
            if (pendingSaveOverwrite)
              executeSaveToMySaved(pendingSaveOverwrite);
            setPendingSaveOverwrite(null);
          }}
        />
      </DndContext>

      {/* Temporary container rendered only during export — matches team page style */}
      {/* opacity:0 on the wrapper hides it visually; the ref is on the inner Box so
        getComputedStyle sees opacity:1 (opacity is not inherited in CSS) */}
      {isCapturing && (
        <Box
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <Box
            ref={exportRef}
            style={{
              width: 900,
              backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
              padding: 16,
            }}
          >
            <Stack gap="md">
              <BattlefieldGrid
                members={teamData.members}
                charMap={charMap}
                characterByIdentity={characterByIdentity}
                characterNameCounts={characterNameCounts}
                getCharacterPath={getCharacterPath}
                factionColor={factionColor}
                isDark={isDark}
                tooltipProps={tooltipProps}
                disableNameClamp
              />
              {teamData.bench && teamData.bench.length > 0 && (
                <BenchSection
                  bench={teamData.bench}
                  charMap={charMap}
                  characterByIdentity={characterByIdentity}
                  characterNameCounts={characterNameCounts}
                  getCharacterPath={getCharacterPath}
                  factionColor={factionColor}
                  tooltipProps={tooltipProps}
                  disableNameClamp
                />
              )}
            </Stack>
          </Box>
        </Box>
      )}
    </>
  );
}
