import {
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import SafeImage from '@/components/ui/SafeImage';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import RichText from '@/components/common/RichText';
import { getCardHoverProps } from '@/constants/styles';
import type { Character } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent } from '@/hooks';
import { getSkillIcon } from '@/assets';

interface CharacterPageSkillsSectionProps {
	character: Character;
	statusEffects: StatusEffect[];
	talentIcon: string | undefined;
	skillIcons: Map<string, string>;
	scrollToSkill: (skillName: string) => void;
	scrollToTalent: () => void;
}

export default function CharacterPageSkillsSection({
	character,
	statusEffects,
	talentIcon,
	skillIcons,
	scrollToSkill,
	scrollToTalent,
}: CharacterPageSkillsSectionProps) {
	const { accent } = useGradientAccent();
	const talent = character.talent;
	const talentLevels = talent?.talent_levels ?? [];
	const divineIcon = getSkillIcon('divinity');

	return (
		<>
			{/* Talent Section */}
			{talentLevels.length > 0 && (
				<CollapsibleSectionCard
					id="talent-section"
					header={
						<Stack gap={2}>
							<Title order={2} size="h3">
								Talent
							</Title>
							<Text size="sm" c="dimmed">
								Talent levels and progression effects for this character.
							</Text>
						</Stack>
					}
				>
					<Stack gap="md">
						<Group gap="md">
							{talentIcon && (
								<SafeImage
									src={talentIcon}
									alt={talent?.name ?? 'Talent'}
									w={54}
									h={74}
									fit="contain"
									loading="lazy"
								/>
							)}
							<Title order={3} size="h4">
								{talent?.name ?? 'Talent'}
							</Title>
						</Group>

						<Stack gap="sm">
							{talentLevels.map((talentLevel, idx) => (
								<Box key={talentLevel.level}>
									<Group gap="xs" mb="xs">
										<Badge variant="filled" color={accent.primary}>
											Level {talentLevel.level}
										</Badge>
									</Group>
									<RichText
										text={talentLevel.effect}
										statusEffects={statusEffects}
										skills={character.skills}
										talent={character.talent ?? null}
										onSkillClick={scrollToSkill}
										onTalentClick={scrollToTalent}
									/>
									{idx < talentLevels.length - 1 && <Divider mt="sm" />}
								</Box>
							))}
						</Stack>
					</Stack>
				</CollapsibleSectionCard>
			)}

			{/* Skills Section */}
			{character.skills.length > 0 && (
				<CollapsibleSectionCard
					header={
						<Stack gap={2}>
							<Title order={2} size="h3">
								Skills
							</Title>
							<Text size="sm" c="dimmed">
								Core skill descriptions, type tags, and cooldown information.
							</Text>
						</Stack>
					}
				>
					<Stack gap="md">
						{character.skills.map((skill) => {
								const skillIcon = skillIcons.get(skill.name);
								const isPassiveCooldown =
									skill.cooldown === 0 || skill.cooldown === '0';
								const cooldownLabel = isPassiveCooldown
									? 'Passive'
									: `${skill.cooldown}s`;

								return (
									<Paper
										key={skill.name}
										id={`skill-${skill.name}`}
										p="md"
										radius="md"
										withBorder
										{...getCardHoverProps()}
									>
										<Stack gap="sm">
											<Group gap="md" justify="space-between" wrap="nowrap">
												<Group gap="md" style={{ flex: 1 }}>
													{skillIcon && (
														<SafeImage
															src={skillIcon}
															alt={skill.name}
															w={60}
															h={60}
															fit="contain"
															loading="lazy"
														/>
													)}
													<Group gap="xs" align="center">
														<Text fw={600} size="lg">
															{skill.name}
														</Text>
														{skill.type && (
															<Badge size="lg" variant="light" color={accent.secondary}>
																{skill.type}
															</Badge>
														)}
													</Group>
												</Group>
												<Group gap="xs" style={{ flexShrink: 0 }}>
													<Badge
														size="lg"
														variant={isPassiveCooldown ? 'light' : 'filled'}
														color={isPassiveCooldown ? 'gray' : accent.primary}
													>
														{cooldownLabel}
													</Badge>
													{skill.cost != null && (
														<Badge size="lg" variant="light" color={accent.secondary}>
															Cost {skill.cost}
														</Badge>
													)}
												</Group>
											</Group>
											<RichText
												text={skill.description}
												statusEffects={statusEffects}
												skills={character.skills}
												talent={character.talent ?? null}
												onSkillClick={scrollToSkill}
												onTalentClick={scrollToTalent}
											/>
										</Stack>
									</Paper>
								);
						})}
					</Stack>
				</CollapsibleSectionCard>
			)}

			{/* Divinity Section */}
			{character.divinity && character.divinity.length > 0 && (
				<CollapsibleSectionCard
					header={
						<Stack gap={2}>
							<Title order={2} size="h3">
								Divinity
							</Title>
							<Text size="sm" c="dimmed">
								Divinity level upgrades and choices for this character.
							</Text>
						</Stack>
					}
				>
					<Stack gap="md">
						{character.divinity.map((divinityLevel, idx) => {
							const isLevel6 = divinityLevel.level === 6;
							return (
								<Box key={divinityLevel.level}>
									<Group gap="xs" mb="xs">
										<Badge variant="filled" color={accent.primary}>
											Level {divinityLevel.level}
										</Badge>
									</Group>
									<Stack gap="sm">
										{divinityLevel.choices.map((choice) => (
											<Paper
												key={choice.name}
												p="md"
												radius="md"
												withBorder
												{...getCardHoverProps()}
											>
												<Stack gap="sm">
													<Group gap="md">
														{isLevel6 && divineIcon && (
															<SafeImage
																src={divineIcon}
																alt={choice.name}
																w={60}
																h={60}
																fit="contain"
																loading="lazy"
															/>
														)}
														<Group gap="xs" align="center">
															<Text fw={600} size="lg">{choice.name}</Text>
															{isLevel6 && (
																<Badge size="lg" variant="light" color={accent.secondary}>
																	Divine Skill
																</Badge>
															)}
														</Group>
													</Group>
													<RichText
														text={choice.description}
														statusEffects={statusEffects}
														skills={character.skills}
														talent={character.talent ?? null}
														onSkillClick={scrollToSkill}
														onTalentClick={scrollToTalent}
													/>
												</Stack>
											</Paper>
										))}
									</Stack>
									{idx < (character.divinity?.length ?? 0) - 1 && (
										<Divider mt="md" />
									)}
								</Box>
							);
						})}
					</Stack>
				</CollapsibleSectionCard>
			)}
		</>
	);
}
