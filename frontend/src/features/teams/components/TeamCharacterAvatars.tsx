import { Badge, Box, Group } from '@mantine/core';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character } from '@/features/characters/types';
import {
	getCharacterBaseSlug,
	resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';

export default function TeamCharacterAvatars({
	refs,
	preferredByName,
	byIdentity,
	size,
	isSubstitute = false,
	layout = 'wrap',
	columns = 3,
	gap = 4,
	wrap = 'wrap',
	maxVisible,
	nameCounts,
}: {
	refs: Array<{ name: string; quality?: string }>;
	preferredByName: Map<string, Character>;
	byIdentity: Map<string, Character>;
	size: number;
	isSubstitute?: boolean;
	layout?: 'wrap' | 'grid';
	columns?: number;
	gap?: number;
	wrap?: 'wrap' | 'nowrap';
	maxVisible?: number;
	nameCounts?: Map<string, number>;
}) {
	const shouldLimitVisibleCount =
		typeof maxVisible === 'number' &&
		maxVisible >= 0 &&
		(layout === 'grid' || wrap === 'nowrap');

	const visibleNames = shouldLimitVisibleCount
		? refs.slice(0, maxVisible)
		: refs;
	const hiddenCount = refs.length - visibleNames.length;

	const portraits = visibleNames.map((entry) => {
		const char = resolveCharacterByNameAndQuality(
			entry.name,
			entry.quality,
			preferredByName,
			byIdentity
		);
		const displayName = char?.name ?? entry.name;
		const isMultiQualityCharacter =
			(nameCounts?.get(getCharacterBaseSlug(displayName)) ?? 1) > 1;
		const displayLabel =
			isMultiQualityCharacter && char?.quality
				? `${displayName} (${char.quality})`
				: displayName;
		return (
			<CharacterPortrait
				key={`${isSubstitute ? 'sub' : 'main'}-${entry.name}-${entry.quality ?? ''}`}
				name={displayName}
				size={size}
				quality={char?.quality}
				isSubstitute={isSubstitute}
				tooltip={isSubstitute ? `${displayLabel} (Sub)` : displayLabel}
			/>
		);
	});

	const overflowIndicator =
		hiddenCount > 0 ? (
			<Badge
				key={`${isSubstitute ? 'sub' : 'main'}-overflow`}
				size="sm"
				variant="light"
				color="gray"
				style={{
					width: size,
					height: size,
					borderRadius: '50%',
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: 0,
					fontSize: 11,
					fontWeight: 600,
					lineHeight: 1,
					flexShrink: 0,
				}}
			>
				+{hiddenCount}
			</Badge>
		) : null;

	const portraitItems = overflowIndicator
		? [...portraits, overflowIndicator]
		: portraits;

	if (layout === 'grid') {
		return (
			<Box
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${columns}, ${size}px)`,
					gap: 6,
				}}
			>
				{portraitItems}
			</Box>
		);
	}

	return (
		<Group gap={gap} wrap={wrap}>
			{portraitItems}
		</Group>
	);
}
