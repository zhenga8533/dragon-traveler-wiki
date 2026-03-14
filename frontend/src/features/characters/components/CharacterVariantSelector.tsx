import {
	Container,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import ClassTag from '@/features/characters/components/ClassTag';
import FactionTag from '@/features/characters/components/FactionTag';
import GlobalBadge from '@/components/ui/GlobalBadge';
import QualityIcon from '@/features/characters/components/QualityIcon';
import { getCardHoverProps } from '@/constants/styles';
import { CHARACTER_CARD } from '@/constants/ui';
import { useGradientAccent } from '@/hooks';
import type { Character } from '@/features/characters/types';
import {
	getCharacterIdentityKey,
	getCharacterRoutePath,
} from '@/features/characters/utils/character-route';

interface CharacterVariantSelectorProps {
	variants: Character[];
	characterNameCounts: Map<string, number>;
}

export default function CharacterVariantSelector({
	variants,
	characterNameCounts,
}: CharacterVariantSelectorProps) {
	const { accent } = useGradientAccent();

	if (variants.length === 0) {
		return null;
	}

	return (
		<Container size="lg" py="md">
			<Stack gap="md">
				<Stack gap={4}>
					<Text size="lg" fw={700}>
						Choose a {variants[0].name} rarity
					</Text>
					<Text c="dimmed" size="sm">
						This character has multiple rarities. Pick one to view detailed
						skills, builds, and references.
					</Text>
				</Stack>

				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
					{variants.map((variant) => {
						const routePath = getCharacterRoutePath(
							variant,
							characterNameCounts
						);

						return (
							<UnstyledButton
								key={getCharacterIdentityKey(variant)}
								component={Link}
								to={routePath}
								style={{ textDecoration: 'none', display: 'block' }}
							>
								<Paper
									withBorder
									radius="md"
									p="sm"
									{...getCardHoverProps({ interactive: true })}
								>
									<Group gap="sm" align="flex-start" wrap="nowrap">
										<CharacterPortrait
											name={variant.name}
											size={CHARACTER_CARD.PORTRAIT_SIZE}
											quality={variant.quality}
											borderWidth={3}
											routePath={routePath}
											style={{ flexShrink: 0 }}
										/>

										<Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
											<Group justify="space-between" align="flex-start" gap={6}>
												<Group gap={6} wrap="wrap" style={{ minWidth: 0 }}>
													<Text
														fw={700}
														size="sm"
														c={`${accent.primary}.7`}
														lineClamp={1}
													>
														{variant.name}
													</Text>
													<QualityIcon quality={variant.quality} size={16} />
												</Group>
												<GlobalBadge isGlobal={variant.is_global} size="sm" />
											</Group>

											<Group gap={6} wrap="wrap" align="center">
												<ClassTag
													characterClass={variant.character_class}
													size="xs"
												/>
												{variant.title && (
													<Text size="xs" c="dimmed" lineClamp={1}>
														{variant.title}
													</Text>
												)}
											</Group>

											{variant.factions.length > 0 && (
												<Group gap={4} wrap="wrap">
													{variant.factions.map((faction) => (
														<FactionTag
															key={faction}
															faction={faction}
															size="xs"
														/>
													))}
												</Group>
											)}

											<Text fw={600} c={`${accent.primary}.7`} size="xs">
												Open details →
											</Text>
										</Stack>
									</Group>
								</Paper>
							</UnstyledButton>
						);
					})}
				</SimpleGrid>
			</Stack>
		</Container>
	);
}
