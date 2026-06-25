import {
	Box,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { useMemo } from 'react';
import {
	IoArchive,
	IoCube,
	IoDiamond,
	IoFlame,
	IoFlash,
	IoGrid,
	IoPaw,
	IoPeople,
	IoShield,
	IoSparkles,
	IoEgg,
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import LastUpdated from '@/components/common/LastUpdated';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import {
  useArtifacts,
  useGear,
  useHowlkins,
  useNoblePhantasms,
  useRelics,
  useResources,
  useStatusEffects,
  useSubclasses,
  useWyrms,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
import { useGradientAccent } from '@/hooks';

type StatItem = {
	label: string;
	to: string;
	color: string;
	icon: React.ComponentType<{ size?: number }>;
	count: number;
};

export default function DataStatsBar() {
	const { accent } = useGradientAccent();
	const accentCycle = [
		accent.primary,
		accent.secondary,
		accent.tertiary,
		accent.primary,
		accent.secondary,
		accent.tertiary,
		accent.primary,
		accent.secondary,
		accent.tertiary,
		accent.primary,
		accent.secondary,
	];

	const { data: characters, loading: l1 } = useCharacters();
	const { data: wyrmspells, loading: l2 } = useWyrmspells();
	const { data: statusEffects, loading: l3 } = useStatusEffects();
	const { data: artifacts, loading: l4 } = useArtifacts();
	const { data: resources, loading: l5 } = useResources();
	const { data: noblePhantasms, loading: l6 } = useNoblePhantasms();
	const { data: howlkins, loading: l7 } = useHowlkins();
	const { data: gear, loading: l8 } = useGear();
	const { data: subclasses, loading: l9 } = useSubclasses();
	const { data: relics, loading: l10 } = useRelics();
	const { data: wyrms, loading: l11 } = useWyrms();

	const mostRecentUpdate = useMemo(() => {
		let latest = 0;
		const updateLists: Array<Array<{ last_updated?: number | null }>> = [
			characters,
			wyrmspells,
			statusEffects,
			artifacts,
			resources,
			noblePhantasms,
			howlkins,
			gear,
			subclasses,
			relics,
			wyrms,
		];
		for (const list of updateLists) {
			for (const item of list) {
				const updatedAt = item.last_updated ?? 0;
				if (updatedAt > latest) latest = updatedAt;
			}
		}
		return latest;
	}, [
		artifacts,
		characters,
		howlkins,
		noblePhantasms,
		resources,
		statusEffects,
		wyrmspells,
		gear,
		subclasses,
		relics,
		wyrms,
	]);

	if (l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11) {
		return (
			<SimpleGrid cols={{ base: 3, sm: 6, lg: 11 }} spacing={0}>
				{Array.from({ length: 11 }).map((_, i) => (
					<Stack key={i} gap={4} align="center" py="sm">
						<Skeleton height={28} width={28} radius="md" />
						<Skeleton height={12} width={30} radius="xs" />
						<Skeleton height={10} width={50} radius="xs" />
					</Stack>
				))}
			</SimpleGrid>
		);
	}

	const stats: StatItem[] = [
		{
			label: 'Artifacts',
			count: artifacts.length,
			to: '/artifacts',
			color: accentCycle[0],
			icon: IoDiamond,
		},
		{
			label: 'Characters',
			count: characters.length,
			to: '/characters',
			color: accentCycle[1],
			icon: IoPeople,
		},
		{
			label: 'Gear',
			count: gear.length,
			to: '/gear',
			color: accentCycle[2],
			icon: IoShield,
		},
		{
			label: 'Howlkins',
			count: howlkins.length,
			to: '/howlkins',
			color: accentCycle[3],
			icon: IoPaw,
		},
		{
			label: 'Noble Phantasms',
			count: noblePhantasms.length,
			to: '/noble-phantasms',
			color: accentCycle[4],
			icon: IoFlash,
		},
		{
			label: 'Resources',
			count: resources.length,
			to: '/resources',
			color: accentCycle[5],
			icon: IoCube,
		},
		{
			label: 'Status Effects',
			count: statusEffects.length,
			to: '/status-effects',
			color: accentCycle[6],
			icon: IoSparkles,
		},
		{
			label: 'Subclasses',
			count: subclasses.length,
			to: '/subclasses',
			color: accentCycle[7],
			icon: IoGrid,
		},
		{
			label: 'Relics',
			count: relics.length,
			to: '/relics',
			color: accentCycle[8],
			icon: IoArchive,
		},
		{
			label: 'Wyrmspells',
			count: wyrmspells.length,
			to: '/wyrmspells',
			color: accentCycle[9],
			icon: IoFlame,
		},
		{
			label: 'Wyrms',
			count: wyrms.length,
			to: '/wyrms',
			color: accentCycle[10],
			icon: IoEgg,
		},
	];

	return (
		<Stack gap="md">
			<SimpleGrid cols={{ base: 3, sm: 6, lg: 11 }} spacing={0}>
				{stats.map((stat) => (
					<Box
						key={stat.to}
						component={Link}
						to={stat.to}
						py="sm"
						px="xs"
						className="dt-stat-link"
						style={{ textDecoration: 'none' }}
					>
						<Stack gap={4} align="center">
							<ThemeIcon
								variant="light"
								color={stat.color}
								size="lg"
								radius="md"
							>
								<stat.icon size={16} />
							</ThemeIcon>
							<Text
								fw={700}
								size="sm"
								ta="center"
								lh={1}
								c={`${stat.color}.7`}
							>
								{stat.count}
							</Text>
							<Text size="xs" c="dimmed" ta="center" lh={1.3}>
								{stat.label}
							</Text>
						</Stack>
					</Box>
				))}
			</SimpleGrid>
			<Group justify="center">
				<LastUpdated timestamp={mostRecentUpdate} />
			</Group>
		</Stack>
	);
}
