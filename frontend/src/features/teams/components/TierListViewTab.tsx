import {
	Badge,
	Group,
	ScrollArea,
	SimpleGrid,
	Stack,
	Table,
	Tabs,
	Text,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import CharacterCard from '@/features/characters/components/CharacterCard';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import ChangeHistory from '@/components/common/ChangeHistory';
import ClassTag from '@/features/characters/components/ClassTag';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import EntityActionButtons from '@/components/common/EntityActionButtons';
import FactionTag from '@/features/characters/components/FactionTag';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import QualityIcon from '@/features/characters/components/QualityIcon';
import { CHARACTER_GRID_SPACING, IMAGE_SIZE } from '@/constants/ui';
import { useEntityTabParam, useGradientAccent, useIsMobile } from '@/hooks';
import type { ChangesFile } from '@/types/changes';
import type { Character } from '@/features/characters/types';
import type { TierList as TierListType } from '@/features/teams/tier-list-types';
import {
	getCharacterBaseSlug,
	getCharacterIdentityKey,
	getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import { sortCharactersByQuality } from '@/features/characters/utils/filter-characters';
import TierListContent from '@/features/teams/components/TierListContent';

interface TierListViewTabProps {
	visibleTierLists: TierListType[];
	characters: Character[];
	resolveTierEntryCharacter: (
		entry: TierListType['entries'][number]
	) => Character | null | undefined;
	characterNameCounts: Map<string, number>;
	viewMode: string;
	onClearFilters: () => void;
	onOpenFilters: () => void;
	tierListChanges: ChangesFile;
	onRequestEdit: (tierList: TierListType) => void;
	onRequestExport: (name: string) => void;
	isExporting: string | null;
	exportRefCallback: (name: string, node: HTMLDivElement | null) => void;
	characterFilter: (character: Character) => boolean;
	hasCharacterFilters: boolean;
}

export default function TierListViewTab({
	visibleTierLists,
	characters,
	resolveTierEntryCharacter,
	characterNameCounts,
	viewMode,
	onClearFilters,
	onOpenFilters,
	tierListChanges,
	onRequestEdit,
	onRequestExport,
	isExporting,
	exportRefCallback,
	characterFilter,
	hasCharacterFilters,
}: TierListViewTabProps) {
	const isMobile = useIsMobile();
	const { accent } = useGradientAccent();
	const [activeTierListName, handleSelectTierList] = useEntityTabParam(
		'list',
		visibleTierLists
	);

	return (
		<>
			{visibleTierLists.length === 0 && (
				<NoResultsSuggestions
					title="No tier lists found"
					message="No tier lists match the current filters."
					onReset={onClearFilters}
					onOpenFilters={onOpenFilters}
				/>
			)}

			{visibleTierLists.length > 0 && (
				<Tabs value={activeTierListName} onChange={handleSelectTierList}>
					<ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
						<Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
							{visibleTierLists.map((tierList) => (
								<Tabs.Tab
									key={tierList.name}
									value={tierList.name}
									style={{ minHeight: 40 }}
								>
									{tierList.name}
								</Tabs.Tab>
							))}
						</Tabs.List>
					</ScrollArea>

					{visibleTierLists.map((tierList) => {
						const rankedNames = new Set(
							tierList.entries
								.filter((entry) => {
									if (!hasCharacterFilters) return true;
									const resolved = resolveTierEntryCharacter(entry);
									return resolved ? characterFilter(resolved) : false;
								})
								.map((e) => {
									const resolved = resolveTierEntryCharacter(e);
									return resolved
										? getCharacterIdentityKey(resolved)
										: getCharacterIdentityKey(
												e.character_name,
												e.character_quality
											);
								})
						);
						const unranked = sortCharactersByQuality(
							characters.filter(
								(c) =>
									!rankedNames.has(getCharacterIdentityKey(c)) &&
									(!hasCharacterFilters || characterFilter(c))
							)
						);

						const headerActions = (
							<EntityActionButtons
								onEdit={() => onRequestEdit(tierList)}
								onExport={() => onRequestExport(tierList.name)}
								isExporting={isExporting === tierList.name}
								size={isMobile ? 'xs' : 'compact-xs'}
								variant="light"
							/>
						);

						return (
							<Tabs.Panel key={tierList.name} value={tierList.name} pt="md">
								<Stack gap="md">
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
										characterFilter={
											hasCharacterFilters ? characterFilter : undefined
										}
									/>

									{unranked.length > 0 && (
										<CollapsibleSectionCard
											defaultExpanded={false}
											header={
												<Badge
													variant="filled"
													color="gray"
													size="lg"
													radius="sm"
												>
													Unranked
												</Badge>
											}
										>
											{viewMode === 'grid' ? (
												<SimpleGrid
													cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
													spacing={CHARACTER_GRID_SPACING}
												>
													{unranked.map((c) => {
														const isMultiQuality =
															(characterNameCounts.get(
																getCharacterBaseSlug(c.name)
															) ?? 1) > 1;
														return (
															<CharacterCard
																key={getCharacterIdentityKey(c)}
																name={c.name}
																label={
																	isMultiQuality
																		? `${c.name} (${c.quality})`
																		: undefined
																}
																quality={c.quality}
																routePath={getCharacterRoutePath(
																	c,
																	characterNameCounts
																)}
															/>
														);
													})}
												</SimpleGrid>
											) : (
												<ScrollArea
													type="auto"
													scrollbarSize={6}
													offsetScrollbars
												>
													<Table
														striped
														highlightOnHover
														style={{ minWidth: 460 }}
													>
														<Table.Thead>
															<Table.Tr>
																<Table.Th>Character</Table.Th>
																<Table.Th>Quality</Table.Th>
																<Table.Th>Class</Table.Th>
																<Table.Th>Factions</Table.Th>
															</Table.Tr>
														</Table.Thead>
														<Table.Tbody>
															{unranked.map((c) => {
																const isMultiQuality =
																	(characterNameCounts.get(
																		getCharacterBaseSlug(c.name)
																	) ?? 1) > 1;
																const displayName = isMultiQuality
																	? `${c.name} (${c.quality})`
																	: c.name;
																return (
																	<Table.Tr key={getCharacterIdentityKey(c)}>
																		<Table.Td>
																			<Group gap="sm" wrap="nowrap">
																				<CharacterPortrait
																					name={c.name}
																					size={32}
																					quality={c.quality}
																				/>
																				<Text
																					component={Link}
																					to={getCharacterRoutePath(
																						c,
																						characterNameCounts
																					)}
																					size="sm"
																					fw={500}
																					c={`${accent.primary}.7`}
																				>
																					{displayName}
																				</Text>
																			</Group>
																		</Table.Td>
																		<Table.Td>
																			<QualityIcon
																				quality={c.quality}
																				size={IMAGE_SIZE.ICON_LG}
																			/>
																		</Table.Td>
																		<Table.Td>
																			<ClassTag
																				characterClass={c.character_class}
																				size="sm"
																			/>
																		</Table.Td>
																		<Table.Td className="table-badge-cell">
																			<Group
																				gap={4}
																				wrap="wrap"
																				className="table-badge-list"
																			>
																				{c.factions.map((faction) => (
																					<FactionTag
																						key={faction}
																						faction={faction}
																						size="xs"
																					/>
																				))}
																			</Group>
																		</Table.Td>
																	</Table.Tr>
																);
															})}
														</Table.Tbody>
													</Table>
												</ScrollArea>
											)}
										</CollapsibleSectionCard>
									)}

									<ChangeHistory history={tierListChanges[tierList.name]} />
								</Stack>
							</Tabs.Panel>
						);
					})}
				</Tabs>
			)}
		</>
	);
}
