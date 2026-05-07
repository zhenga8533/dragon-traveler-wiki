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
					</Stack>
				</CollapsibleSectionCard>
			)}
		</>
	);
}
