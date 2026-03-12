import {
	Badge,
	Collapse,
	Divider,
	Group,
	Image,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { FACTION_WYRM_MAP } from '@/assets/wyrms';
import EntityActionButtons from '@/components/common/EntityActionButtons';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import FactionTag from '@/features/characters/components/FactionTag';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import PaginationControl from '@/components/ui/PaginationControl';
import {
	getContentTypeColor,
	normalizeContentType,
} from '@/constants/content-types';
import { getMinWidthStyle } from '@/constants/styles';
import { useGradientAccent } from '@/hooks';
import type { Character } from '@/features/characters/types';
import type { FactionName } from '@/types/faction';
import type { Team } from '@/features/teams/types';
import { toEntitySlug } from '@/utils/entity-slug';
import {
	getTeamBenchEntryName,
	getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import TeamCard from '@/features/teams/components/TeamCard';
import TeamCharacterAvatars from '@/features/teams/components/TeamCharacterAvatars';

interface TeamsViewTabProps {
	paginatedTeams: Team[];
	filteredTeams: Team[];
	charMap: Map<string, Character>;
	characterByIdentity: Map<string, Character>;
	characterNameCounts: Map<string, number>;
	viewMode: string;
	filterOpen: boolean;
	entityFilterGroups: ChipFilterGroup[];
	viewFilters: Record<string, string[]>;
	search: string;
	onFilterChange: (key: string, values: string[]) => void;
	onSearchChange: (value: string) => void;
	onClearFilters: () => void;
	onOpenFilters: () => void;
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	pageSize: number;
	pageSizeOptions: readonly number[];
	onPageSizeChange: (pageSize: number) => void;
	onRequestEdit: (team: Team) => void;
}

export default function TeamsViewTab({
	paginatedTeams,
	filteredTeams,
	charMap,
	characterByIdentity,
	characterNameCounts,
	viewMode,
	filterOpen,
	entityFilterGroups,
	viewFilters,
	search,
	onFilterChange,
	onSearchChange,
	onClearFilters,
	onOpenFilters,
	page,
	totalPages,
	onPageChange,
	pageSize,
	pageSizeOptions,
	onPageSizeChange,
	onRequestEdit,
}: TeamsViewTabProps) {
	const navigate = useNavigate();
	const { accent } = useGradientAccent();

	return (
		<>
			<Collapse in={filterOpen}>
				<Paper p="sm" radius="md" withBorder bg="var(--mantine-color-body)">
					<EntityFilter
						groups={entityFilterGroups}
						selected={viewFilters}
						onChange={(key, values) => onFilterChange(key, values)}
						onClear={onClearFilters}
						search={search}
						onSearchChange={onSearchChange}
						searchPlaceholder="Search teams..."
					/>
				</Paper>
			</Collapse>

			{filteredTeams.length === 0 && (
				<NoResultsSuggestions
					title={search ? 'No teams found' : 'No matching teams'}
					message={
						search
							? 'No teams match your search.'
							: 'No teams match the current filters.'
					}
					onReset={onClearFilters}
					onOpenFilters={onOpenFilters}
				/>
			)}

			{viewMode === 'grid' ? (
				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
					{paginatedTeams.map((team) => (
						<TeamCard
							key={team.name}
							team={team}
							charMap={charMap}
							characterByIdentity={characterByIdentity}
							characterNameCounts={characterNameCounts}
							onNavigate={() => navigate(`/teams/${toEntitySlug(team.name)}`)}
							actions={
								<EntityActionButtons
									onEdit={() => onRequestEdit(team)}
									size="compact-xs"
									variant="subtle"
									stopPropagation
								/>
							}
						/>
					))}
				</SimpleGrid>
			) : (
				<ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
					<Table striped highlightOnHover style={getMinWidthStyle(640)}>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Name</Table.Th>
								<Table.Th>Members</Table.Th>
								<Table.Th>Faction</Table.Th>
								<Table.Th>Content Type</Table.Th>
								<Table.Th>Author</Table.Th>
								<Table.Th>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{paginatedTeams.map((team) => {
								return (
									<Table.Tr
										key={team.name}
										style={{ cursor: 'pointer' }}
										onClick={() =>
											navigate(`/teams/${toEntitySlug(team.name)}`)
										}
									>
										<Table.Td>
											<Group gap="sm" wrap="nowrap">
												<Image
													src={FACTION_WYRM_MAP[team.faction as FactionName]}
													alt={`${team.faction} Whelp`}
													w={28}
													h={28}
													fit="contain"
												/>
												<Text
													component={Link}
													to={`/teams/${toEntitySlug(team.name)}`}
													size="sm"
													fw={500}
													c={`${accent.primary}.7`}
													style={{ textDecoration: 'none' }}
													onClick={(e) => e.stopPropagation()}
												>
													{team.name}
												</Text>
											</Group>
										</Table.Td>
										<Table.Td>
											<Paper
												p="xs"
												radius="sm"
												bg="var(--mantine-color-default-hover)"
											>
												<Stack gap="xs">
													<Group gap="xs" align="center" wrap="nowrap">
														<Badge
															size="xs"
															variant="light"
															color={accent.primary}
															style={{
																minWidth: 56,
																justifyContent: 'center',
															}}
														>
															Main
														</Badge>
														<TeamCharacterAvatars
															refs={team.members.map((member) => ({
																name: member.character_name,
																quality: member.character_quality,
															}))}
															preferredByName={charMap}
															byIdentity={characterByIdentity}
															nameCounts={characterNameCounts}
															size={32}
															maxVisible={5}
														/>
													</Group>
													{(team.bench?.length ?? 0) > 0 && (
														<>
															<Divider size="xs" />
															<Group gap="xs" align="center" wrap="nowrap">
																<Badge
																	size="xs"
																	variant="light"
																	color="gray"
																	style={{
																		minWidth: 56,
																		justifyContent: 'center',
																	}}
																>
																	Subs
																</Badge>
																<TeamCharacterAvatars
																	refs={team.bench!.map((entry) => ({
																		name: getTeamBenchEntryName(entry),
																		quality: getTeamBenchEntryQuality(entry),
																	}))}
																	preferredByName={charMap}
																	byIdentity={characterByIdentity}
																	nameCounts={characterNameCounts}
																	size={32}
																	isSubstitute
																	maxVisible={5}
																/>
															</Group>
														</>
													)}
												</Stack>
											</Paper>
										</Table.Td>
										<Table.Td>
											<FactionTag
												faction={team.faction as FactionName}
												size="sm"
											/>
										</Table.Td>
										<Table.Td>
											<Badge
												variant="light"
												size="sm"
												color={getContentTypeColor(team.content_type, 'All')}
											>
												{normalizeContentType(team.content_type, 'All')}
											</Badge>
										</Table.Td>
										<Table.Td>
											<Text size="sm" c={`${accent.primary}.7`}>
												{team.author}
											</Text>
										</Table.Td>
										<Table.Td>
											<Group gap={4} wrap="nowrap">
												<EntityActionButtons
													onEdit={() => onRequestEdit(team)}
													size="compact-xs"
													variant="subtle"
													stopPropagation
												/>
											</Group>
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				</ScrollArea>
			)}

			<PaginationControl
				currentPage={page}
				totalPages={totalPages}
				onChange={onPageChange}
				totalItems={filteredTeams.length}
				pageSize={pageSize}
				pageSizeOptions={pageSizeOptions}
				onPageSizeChange={onPageSizeChange}
			/>
		</>
	);
}
