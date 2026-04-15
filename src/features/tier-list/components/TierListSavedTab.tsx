import {
	Button,
	Paper,
	ScrollArea,
	Stack,
	Tabs,
	Text,
} from '@mantine/core';
import { IoCreate } from 'react-icons/io5';
import EntityActionButtons from '@/components/common/EntityActionButtons';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import { useEntityTabParam, useGradientAccent, useIsMobile } from '@/hooks';
import type { Character } from '@/features/characters/types';
import type { TierList as TierListType } from '@/features/tier-list/types';
import TierListContent from '@/features/tier-list/components/TierListContent';

interface TierListSavedTabProps {
	savedTierLists: TierListType[];
	visibleSavedTierLists: TierListType[];
	resolveTierEntryCharacter: (
		entry: TierListType['entries'][number]
	) => Character | null | undefined;
	characterNameCounts: Map<string, number>;
	viewMode: string;
	search: string;
	onClearFilters: () => void;
	onOpenFilters: () => void;
	onRequestEdit: (tierList: TierListType) => void;
	onRequestExport: (name: string) => void;
	isExporting: string | null;
	exportRefCallback: (name: string, node: HTMLDivElement | null) => void;
	onRequestDelete: (name: string) => void;
	onGoToBuilder: () => void;
	characterFilter: (character: Character) => boolean;
}

export default function TierListSavedTab({
	savedTierLists,
	visibleSavedTierLists,
	resolveTierEntryCharacter,
	characterNameCounts,
	viewMode,
	search,
	onClearFilters,
	onOpenFilters,
	onRequestEdit,
	onRequestExport,
	isExporting,
	exportRefCallback,
	onRequestDelete,
	onGoToBuilder,
	characterFilter,
}: TierListSavedTabProps) {
	const isMobile = useIsMobile();
	const { accent } = useGradientAccent();
	const [activeValue, handleSelectTierList] = useEntityTabParam(
		'saved-list',
		visibleSavedTierLists
	);

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
						color={accent.primary}
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

	if (visibleSavedTierLists.length === 0) {
		return (
			<>
		<NoResultsSuggestions
					title={
						search
							? 'No saved tier lists found'
							: 'No matching saved tier lists'
					}
					message={
						search
							? 'No saved tier lists match your search.'
							: 'No saved tier lists match the current filters.'
					}
					onReset={onClearFilters}
					onOpenFilters={onOpenFilters}
				/>
			</>
		);
	}

	return (
		<>
<Tabs value={activeValue} onChange={handleSelectTierList}>
				<ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
					<Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
						{visibleSavedTierLists.map((tl) => (
							<Tabs.Tab
								key={tl.name}
								value={tl.name}
								style={{ minHeight: 40 }}
							>
								{tl.name || 'Untitled'}
							</Tabs.Tab>
						))}
					</Tabs.List>
				</ScrollArea>

				{visibleSavedTierLists.map((tierList) => {
					const headerActions = (
						<EntityActionButtons
							onEdit={() => onRequestEdit(tierList)}
							onExport={() => onRequestExport(tierList.name)}
							isExporting={isExporting === tierList.name}
							onDelete={() => onRequestDelete(tierList.name)}
							size={isMobile ? 'xs' : 'compact-xs'}
							variant="light"
						/>
					);

					return (
						<Tabs.Panel key={tierList.name} value={tierList.name} pt="md">
							<TierListContent
								tierList={tierList}
								resolveTierEntryCharacter={resolveTierEntryCharacter}
								characterNameCounts={characterNameCounts}
								viewMode={viewMode}
								headerActions={headerActions}
								disableNameClamp={isExporting === tierList.name}
								exportRefCallback={(node) =>
									exportRefCallback(tierList.name, node)
								}
								characterFilter={characterFilter}
							/>
						</Tabs.Panel>
					);
				})}
			</Tabs>
		</>
	);
}
