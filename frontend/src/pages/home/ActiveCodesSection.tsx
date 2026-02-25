import {
  ActionIcon,
  Box,
  CopyButton,
  Group,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IoCheckmark, IoCopyOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import ResourceBadge from '../../components/common/ResourceBadge';
import { useDataFetch } from '../../hooks';
import type { Code } from '../../types/code';
import { isCodeActive } from '../../utils';

export default function ActiveCodesSection() {
  const { data: codes, loading } = useDataFetch<Code[]>('data/codes.json', []);
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
        <Box
          key={entry.code}
          p="xs"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'var(--mantine-color-default-hover)',
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text ff="monospace" fw={500} size="sm" truncate>
              {entry.code}
            </Text>
            <CopyButton value={entry.code} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy'} withArrow>
                  <ActionIcon
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'}
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
            <Group gap={4} mt={4} wrap="wrap">
              {Object.entries(entry.rewards ?? {}).map(([name, qty]) => (
                <ResourceBadge
                  key={name}
                  name={name}
                  quantity={qty}
                  size="xs"
                />
              ))}
            </Group>
          )}
        </Box>
      ))}
      <Text
        component={Link}
        to="/codes"
        size="xs"
        c="dimmed"
        td="underline"
        style={{ alignSelf: 'flex-end' }}
      >
        View all codes
      </Text>
    </Stack>
  );
}
