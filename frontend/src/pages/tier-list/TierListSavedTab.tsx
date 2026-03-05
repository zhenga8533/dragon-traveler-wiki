import { Button, CopyButton, Paper, Stack, Tabs, Text } from '@mantine/core';
import { IoCreate, IoTrash } from 'react-icons/io5';
import TierListContent from '../../components/tier-list/TierListContent';
import type { Character } from '../../types/character';
import type { TierList as TierListType } from '../../types/tier-list';

interface TierListSavedTabProps {
  savedTierLists: TierListType[];
  resolveTierEntryCharacter: (
    entry: TierListType['entries'][number]
  ) => Character | null | undefined;
  characterNameCounts: Map<string, number>;
  viewMode: string;
  onRequestEdit: (tierList: TierListType) => void;
  onRequestDelete: (name: string) => void;
  onGoToBuilder: () => void;
}

export default function TierListSavedTab({
  savedTierLists,
  resolveTierEntryCharacter,
  characterNameCounts,
  viewMode,
  onRequestEdit,
  onRequestDelete,
  onGoToBuilder,
}: TierListSavedTabProps) {
  if (savedTierLists.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="sm">
          <Text c="dimmed">No saved tier lists yet.</Text>
          <Text size="xs" c="dimmed">
            Use the &ldquo;Create Your Own&rdquo; tab to build and save a tier
            list.
          </Text>
          <Button
            variant="light"
            size="sm"
            leftSection={<IoCreate size={16} />}
            onClick={onGoToBuilder}
          >
            Go to Builder
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Tabs defaultValue={savedTierLists[0]?.name}>
      <Tabs.List style={{ flexWrap: 'wrap' }}>
        {savedTierLists.map((tl) => (
          <Tabs.Tab key={tl.name} value={tl.name}>
            {tl.name || 'Untitled'}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {savedTierLists.map((tierList) => {
        const headerActions = (
          <>
            <Button
              variant="light"
              size="compact-xs"
              leftSection={<IoCreate size={12} />}
              onClick={() => onRequestEdit(tierList)}
            >
              Load
            </Button>
            <CopyButton value={JSON.stringify(tierList, null, 2)}>
              {({ copy, copied }) => (
                <Button
                  variant="light"
                  size="compact-xs"
                  color={copied ? 'teal' : undefined}
                  onClick={copy}
                >
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
              )}
            </CopyButton>
            <Button
              variant="light"
              size="compact-xs"
              color="red"
              leftSection={<IoTrash size={12} />}
              onClick={() => onRequestDelete(tierList.name)}
            >
              Delete
            </Button>
          </>
        );

        return (
          <Tabs.Panel key={tierList.name} value={tierList.name} pt="md">
            <TierListContent
              tierList={tierList}
              resolveTierEntryCharacter={resolveTierEntryCharacter}
              characterNameCounts={characterNameCounts}
              viewMode={viewMode}
              headerActions={headerActions}
            />
          </Tabs.Panel>
        );
      })}
    </Tabs>
  );
}
