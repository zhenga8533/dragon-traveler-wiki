import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { getTierColor } from '@/constants/colors';
import { STORAGE_KEY } from '@/constants/ui';
import FilterableCharacterPool from '@/features/characters/components/FilterableCharacterPool';
import type { Character } from '@/features/characters/types';
import {
  getCharacterBaseSlug,
  getCharacterIdentityKey,
} from '@/features/characters/utils/character-route';
import CharacterNoteButton from '@/components/common/CharacterNoteButton';
import { useTierListState } from '@/features/tier-list/hooks/use-tier-list-state';
import type { TierList } from '@/features/tier-list/types';
import { useDarkMode, useGradientAccent, useIsMobile } from '@/hooks';
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
import {
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoAddOutline } from 'react-icons/io5';
import {
  DraggableCharCard,
  TierDropZone,
  TierListMetaFields,
  UnrankedPool,
} from './BuilderElements';
import { TierListExportView } from './ExportView';
import TierListBuilderToolbar from './TierListBuilderToolbar';

interface TierListBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: TierList | null;
}

export default function TierListBuilder({
  characters,
  charMap,
  initialData,
}: TierListBuilderProps) {
  const { accent } = useGradientAccent();
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const [
    clearConfirmOpened,
    { open: openClearConfirm, close: closeClearConfirm },
  ] = useDisclosure(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingSaveOverwrite, setPendingSaveOverwrite] = useState<
    string | null
  >(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const actionButtonSize = isMobile ? 'md' : 'sm';
  const {
    activeId,
    characterNameCounts,
    getCharacterFromKey,
    handleAddTier,
    handleAuthorCommit,
    handleCategoryChange,
    handleCharacterNoteChange,
    handleClear,
    handleDeleteTier,
    handleDescriptionCommit,
    handleDragEnd,
    handleDragStart,
    handleMoveTierDown,
    handleMoveTierUp,
    handleNameCommit,
    handleNewTierNameChange,
    handleNewTierNoteChange,
    handlePasteApply,
    handleSort,
    handleTierNoteChange,
    hasAnyBuilderData,
    hasAnyPlaced,
    json,
    meta,
    newTierName,
    newTierNote,
    notes,
    placements,
    tierDefs,
    tierExportRows,
    tierListData,
    unrankedCharacters,
  } = useTierListState({
    characters,
    charMap,
    initialData,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    })
  );

  const { issueUrl: tierListIssueUrl, emptyIssueUrl: tierListEmptyIssueUrl } =
    useMemo(
      () =>
        buildSuggestionIssueUrls({
          title: '[Tier List] New tier list suggestion',
          json,
          entityType: 'tier list',
        }),
      [json]
    );

  function handleSubmitSuggestion() {
    if (!tierListIssueUrl) {
      window.open(tierListEmptyIssueUrl, '_blank');
      showWarningToast({
        title: 'Tier list JSON is too large',
        message:
          'Please copy the JSON using the Copy JSON button and paste it into the GitHub issue body.',
        autoClose: 8000,
      });
      return;
    }

    window.open(tierListIssueUrl, '_blank');
  }

  useEffect(() => {
    if (!isCapturing) return;
    const el = exportRef.current;
    if (!el) {
      setIsCapturing(false);
      return;
    }
    const run = async () => {
      await new Promise((r) => setTimeout(r, 150));
      try {
        await downloadElementAsPng(
          el,
          tierListData.name || 'tier-list',
          isDark
        );
      } finally {
        setIsCapturing(false);
      }
    };
    run();
  }, [isCapturing, isDark, tierListData.name]);

  function executeSaveToMySaved(key: string) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const normalized: TierList = { ...tierListData, last_updated: now };
      const stored = window.localStorage.getItem(
        STORAGE_KEY.TIER_LIST_MY_SAVED
      );
      const saves: Record<string, TierList> = stored
        ? (JSON.parse(stored) as Record<string, TierList>)
        : {};
      saves[key] = normalized;
      window.localStorage.setItem(
        STORAGE_KEY.TIER_LIST_MY_SAVED,
        JSON.stringify(saves)
      );
      showSuccessToast({
        title: 'Saved!',
        message: `"${key}" saved to My Saved Tier Lists.`,
      });
    } catch {
      // ignore
    }
  }

  function handleSaveToMySaved() {
    try {
      const key = toEntitySlug(tierListData.name?.trim() || 'Untitled');
      const stored = window.localStorage.getItem(
        STORAGE_KEY.TIER_LIST_MY_SAVED
      );
      const saves: Record<string, TierList> = stored
        ? (JSON.parse(stored) as Record<string, TierList>)
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

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Stack gap="md">
          <TierListMetaFields
            name={meta.name}
            author={meta.author}
            categoryName={meta.categoryName}
            description={meta.description}
            onNameCommit={handleNameCommit}
            onAuthorCommit={handleAuthorCommit}
            onCategoryChange={handleCategoryChange}
            onDescriptionCommit={handleDescriptionCommit}
          />

          <TierListBuilderToolbar
            json={json}
            hasAnyPlaced={hasAnyPlaced}
            hasAnyBuilderData={hasAnyBuilderData}
            isCapturing={isCapturing}
            onPasteOpen={openPasteModal}
            onSave={handleSaveToMySaved}
            onSort={handleSort}
            onExport={() => setIsCapturing(true)}
            onSubmit={handleSubmitSuggestion}
            onClear={openClearConfirm}
          />

          {tierDefs.map((tierDef, index) => {
            const tier = tierDef.name;
            const names = placements[tier] || [];
            const color = getTierColor(tier, index);

            return (
              <TierDropZone
                key={tier}
                id={`tier-${tier}`}
                label={`${tier} Tier`}
                color={color}
                note={tierDef.note}
                onNoteChange={(note) => handleTierNoteChange(tier, note)}
                onDelete={() => handleDeleteTier(tier)}
                onMoveUp={() => handleMoveTierUp(index)}
                onMoveDown={() => handleMoveTierDown(index)}
                isFirst={index === 0}
                isLast={index === tierDefs.length - 1}
                canDelete={tierDefs.length > 1}
              >
                {names.map((n) => {
                  const character = getCharacterFromKey(n);
                  const isDuplicate =
                    character &&
                    (characterNameCounts.get(
                      getCharacterBaseSlug(character.name)
                    ) ?? 1) > 1;
                  return (
                    <Box
                      key={n}
                      style={{ position: 'relative', display: 'inline-block' }}
                    >
                      <DraggableCharCard
                        name={character?.name ?? n}
                        label={
                          isDuplicate && character
                            ? `${character.name} (${character.quality})`
                            : undefined
                        }
                        charKey={n}
                        char={character}
                        tier={tier}
                        size={isMobile ? 56 : undefined}
                        nameCounts={characterNameCounts}
                      />
                      <CharacterNoteButton
                        value={notes[n] || ''}
                        onCommit={(value) =>
                          handleCharacterNoteChange(n, value)
                        }
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: 'calc(50% + 24px)',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    </Box>
                  );
                })}
              </TierDropZone>
            );
          })}

          <Group gap="sm" wrap="wrap">
            <TextInput
              placeholder="New tier name (e.g. F)"
              value={newTierName}
              onChange={(e) => handleNewTierNameChange(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTier();
              }}
              size={actionButtonSize}
              style={{ width: isMobile ? '100%' : 150 }}
            />
            <TextInput
              placeholder="Tier note (optional)"
              value={newTierNote}
              onChange={(e) => handleNewTierNoteChange(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTier();
              }}
              size={actionButtonSize}
              style={{ flex: 1, minWidth: isMobile ? '100%' : 140 }}
            />
            <Button
              size={actionButtonSize}
              variant="light"
              color={accent.primary}
              leftSection={<IoAddOutline size={14} />}
              onClick={handleAddTier}
              disabled={
                !newTierName.trim() ||
                tierDefs.some((t) => t.name === newTierName.trim())
              }
            >
              Add Tier
            </Button>
          </Group>

          <FilterableCharacterPool characters={unrankedCharacters}>
            {(filtered, filterHeader, paginationControl) => (
              <UnrankedPool
                filterHeader={filterHeader}
                paginationControl={paginationControl}
              >
                {filtered.map((c) => {
                  const isDuplicate =
                    (characterNameCounts.get(getCharacterBaseSlug(c.name)) ??
                      1) > 1;
                  return (
                    <DraggableCharCard
                      key={getCharacterIdentityKey(c)}
                      name={c.name}
                      label={
                        isDuplicate ? `${c.name} (${c.quality})` : undefined
                      }
                      charKey={getCharacterIdentityKey(c)}
                      char={c}
                      size={isMobile ? 56 : undefined}
                      nameCounts={characterNameCounts}
                    />
                  );
                })}
              </UnrankedPool>
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
                        <DraggableCharCard
                          name={activeChar?.name ?? activeId}
                          label={
                            isDuplicate && activeChar
                              ? `${activeChar.name} (${activeChar.quality})`
                              : undefined
                          }
                          charKey={activeId}
                          char={activeChar}
                          overlay
                          nameCounts={characterNameCounts}
                        />
                      );
                    })()
                  : null}
              </DragOverlay>,
              document.body
            )
          : null}

        <Modal
          opened={pasteModalOpened}
          onClose={() => {
            closePasteModal();
            setPasteText('');
            setPasteError('');
          }}
          title="Paste Tier List JSON"
          size="lg"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Paste a tier list JSON object below to load it into the builder.
            </Text>
            <Textarea
              placeholder={'{\n  "name": "...",\n  "entries": [...]\n}'}
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.currentTarget.value);
                setPasteError('');
              }}
              minRows={8}
              maxRows={20}
              autosize
              error={pasteError || undefined}
              styles={{
                input: {
                  fontFamily: 'monospace',
                  fontSize: 'var(--mantine-font-size-xs)',
                },
              }}
            />
            <Group justify="flex-end">
              <Button
                variant="outline"
                color={accent.primary}
                onClick={() => {
                  closePasteModal();
                  setPasteText('');
                  setPasteError('');
                }}
              >
                Cancel
              </Button>
              <Button
                color={accent.primary}
                onClick={() => {
                  const error = handlePasteApply(pasteText);
                  if (error) {
                    setPasteError(error);
                    return;
                  }
                  closePasteModal();
                  setPasteText('');
                  setPasteError('');
                }}
                disabled={!pasteText.trim()}
              >
                Apply
              </Button>
            </Group>
          </Stack>
        </Modal>

        <ConfirmActionModal
          opened={clearConfirmOpened}
          onCancel={closeClearConfirm}
          title="Clear tier list builder?"
          message="This will remove all ranked characters, notes, custom tier changes, and metadata fields (name, author, category, and description) in the builder."
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
          title="Overwrite saved tier list?"
          message={`A saved tier list named "${pendingSaveOverwrite ?? ''}" already exists. Overwrite it?`}
          confirmLabel="Overwrite"
          confirmColor="blue"
          onConfirm={() => {
            if (pendingSaveOverwrite)
              executeSaveToMySaved(pendingSaveOverwrite);
            setPendingSaveOverwrite(null);
          }}
        />
      </DndContext>

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
            <TierListExportView
              tierListName={tierListData.name || 'My Tier List'}
              author={meta.author || undefined}
              tierRows={tierExportRows}
            />
          </Box>
        </Box>
      )}
    </>
  );
}
