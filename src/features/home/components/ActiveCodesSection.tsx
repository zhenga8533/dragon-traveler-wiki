import {
	ActionIcon,
	CopyButton,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { IoCheckmark, IoCopyOutline } from 'react-icons/io5';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { getCardHoverProps } from '@/constants/styles';
import { useCodes } from '@/features/wiki/hooks/use-wiki-data';
import { useGradientAccent, useMobileTooltip } from '@/hooks';
import { isCodeActive } from '@/utils';

export default function ActiveCodesSection() {
	const tooltipProps = useMobileTooltip();
	const { accent } = useGradientAccent();
	const { data: codes, loading } = useCodes();
	const activeCodes = codes.filter(isCodeActive).reverse().slice(0, 5);

	if (loading) {
		return (
			<Stack gap="xs">
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} height={40} radius="md" />
				))}
			</Stack>
		);
	}

	if (activeCodes.length === 0) {
		return (
			<Text size="sm" c="dimmed" fs="italic">
				No active codes at the moment.
			</Text>
		);
	}

	return (
		<Stack gap="xs">
			{activeCodes.map((entry) => (
				<Paper
					key={entry.code}
					p="xs"
					radius="md"
					withBorder
					{...getCardHoverProps()}
				>
					<Group justify="space-between" wrap="nowrap">
						<Text ff="monospace" fw={500} size="sm" truncate>
							{entry.code}
						</Text>
						<CopyButton value={entry.code} timeout={1500}>
							{({ copied, copy }) => (
								<Tooltip label={copied ? 'Copied!' : 'Copy'} {...tooltipProps}>
									<ActionIcon
										variant="subtle"
										color={copied ? accent.primary : 'gray'}
										size="sm"
										onClick={copy}
										aria-label={copied ? 'Copied!' : 'Copy code'}
									>
										{copied ? (
											<IoCheckmark size={14} />
										) : (
											<IoCopyOutline size={14} />
										)}
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</Group>
					{Object.keys(entry.rewards ?? {}).length > 0 && (
						<Group gap={4} mt="xs" wrap="wrap">
							{Object.entries(entry.rewards ?? {}).map(([slug, qty]) => (
								<ResourceBadge
									key={slug}
									slug={slug}
									quantity={qty}
									size="xs"
								/>
							))}
						</Group>
					)}
				</Paper>
			))}
		</Stack>
	);
}
