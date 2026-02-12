import {
  ActionIcon,
  Alert,
  Button,
  Center,
  Checkbox,
  Container,
  CopyButton,
  Group,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useCallback, useMemo, useState } from 'react';
import {
  IoCheckmark,
  IoCloseCircleOutline,
  IoCopyOutline,
  IoGift,
  IoInformationCircleOutline,
  IoSearch,
  IoTrophy,
} from 'react-icons/io5';
import ResourceBadge from '../components/ResourceBadge';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import { IMAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { Code } from '../types/code';
import { buildExpiredCodeUrl } from '../utils/github-issues';

function aggregateRewards(codes: Code[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const code of codes) {
    for (const r of code.reward) {
      totals.set(r.name, (totals.get(r.name) || 0) + r.quantity);
    }
  }
  return totals;
}

const CODE_FIELDS: FieldDef[] = [
  { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. DRAGONCODE123' },
  { name: 'source', label: 'Source (optional)', type: 'text', placeholder: 'Where did you find this code?' },
];

function loadRedeemed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY.REDEEMED_CODES);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveRedeemed(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY.REDEEMED_CODES, JSON.stringify([...set]));
}

type ViewFilter = 'unredeemed' | 'redeemed' | 'all';

export default function Codes() {
  const { data: codes, loading } = useDataFetch<Code[]>('data/codes.json', []);
  const [redeemed, setRedeemed] = useState<Set<string>>(() => loadRedeemed());
  const [view, setView] = useState<ViewFilter>('unredeemed');
  const [search, setSearch] = useState('');
  const [markAllOpened, { open: openMarkAll, close: closeMarkAll }] =
    useDisclosure(false);
  const [clearAllOpened, { open: openClearAll, close: closeClearAll }] =
    useDisclosure(false);

  const toggleRedeemed = useCallback((code: string) => {
    setRedeemed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      saveRedeemed(next);
      return next;
    });
  }, []);

  const markAllRedeemed = useCallback(() => {
    setRedeemed(() => {
      const next = new Set(codes.map((c) => c.code));
      saveRedeemed(next);
      return next;
    });
    notifications.show({
      title: 'All codes redeemed',
      message: `Marked ${codes.length} codes as redeemed.`,
      color: 'teal',
    });
  }, [codes]);

  const clearAllRedeemed = useCallback(() => {
    setRedeemed(() => {
      const next = new Set<string>();
      saveRedeemed(next);
      return next;
    });
    notifications.show({
      title: 'Redeemed codes cleared',
      message: 'All codes marked as unredeemed.',
      color: 'gray',
    });
  }, []);

  const filtered = useMemo(
    () =>
      codes.filter((entry) => {
        if (view === 'redeemed' && !redeemed.has(entry.code)) return false;
        if (view === 'unredeemed' && redeemed.has(entry.code)) return false;
        if (search && !entry.code.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [codes, view, redeemed, search]
  );

  const unclaimedRewards = useMemo(
    () => aggregateRewards(codes.filter((c) => c.active && !redeemed.has(c.code))),
    [codes, redeemed]
  );

  const claimedRewards = useMemo(
    () => aggregateRewards(codes.filter((c) => redeemed.has(c.code))),
    [codes, redeemed]
  );

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Codes</Title>
          <SuggestModal
            buttonLabel="Suggest a Code"
            modalTitle="Suggest a New Code"
            issueTitle="[Code] New code suggestion"
            fields={CODE_FIELDS}
            excludeFromJson={['source']}
          />
        </Group>

        <Alert
          icon={<IoInformationCircleOutline size={20} />}
          title="How to redeem"
          variant="light"
        >
          <Text size="sm">
            Codes are redeemed in-game via{' '}
            <strong>Settings &gt; Redeem Code</strong>. Each code can only be
            used once per account. Codes are case-sensitive and must be entered
            without leading or trailing spaces.
          </Text>
        </Alert>

        <TextInput
          placeholder="Search codes..."
          leftSection={<IoSearch size={IMAGE_SIZE.ICON_MD} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        <Group justify="space-between" align="center" wrap="wrap">
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as ViewFilter)}
            data={[
              { label: 'Unredeemed', value: 'unredeemed' },
              { label: 'Redeemed', value: 'redeemed' },
              { label: 'All', value: 'all' },
            ]}
          />
          <Group gap="xs">
            <Button size="xs" variant="light" onClick={openMarkAll}>
              Mark All Redeemed
            </Button>
            <Button
              size="xs"
              variant="light"
              color="gray"
              onClick={openClearAll}
            >
              Clear All Redeemed
            </Button>
          </Group>
        </Group>

        {!loading && (unclaimedRewards.size > 0 || claimedRewards.size > 0) && (
          <Stack gap="xs">
            {unclaimedRewards.size > 0 && (
              <Alert
                icon={<IoGift size={20} />}
                title="Total Unclaimed Rewards"
                color="yellow"
                variant="light"
                radius="md"
              >
                <Group gap="xs" wrap="wrap" mt={4}>
                  {[...unclaimedRewards.entries()].map(([name, qty]) => (
                    <ResourceBadge key={name} name={name} quantity={qty} />
                  ))}
                </Group>
              </Alert>
            )}
            {claimedRewards.size > 0 && (
              <Alert
                icon={<IoTrophy size={20} />}
                title="Total Claimed Rewards"
                color="teal"
                variant="light"
                radius="md"
              >
                <Group gap="xs" wrap="wrap" mt={4}>
                  {[...claimedRewards.entries()].map(([name, qty]) => (
                    <ResourceBadge key={name} name={name} quantity={qty} />
                  ))}
                </Group>
              </Alert>
            )}
          </Stack>
        )}

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && filtered.length === 0 && (
          <Text c="dimmed" ta="center" py="lg">
            {search
              ? 'No codes match your search.'
              : view === 'redeemed'
                ? 'No codes marked as redeemed yet.'
                : view === 'unredeemed'
                  ? 'All codes have been redeemed!'
                  : 'No codes available.'}
          </Text>
        )}

        {!loading &&
          filtered.map((entry) => (
            <Paper
              key={entry.code}
              p="sm"
              radius="md"
              withBorder
              opacity={entry.active ? 1 : 0.5}
            >
              <Group justify="space-between" wrap="wrap" align="center">
                <Group gap="sm" wrap="wrap" style={{ flex: 1, minWidth: 200 }}>
                  <Text
                    ff="monospace"
                    fw={500}
                    size="lg"
                    td={entry.active ? undefined : 'line-through'}
                  >
                    {entry.code}
                  </Text>
                  {!entry.active && (
                    <Badge color="red" variant="light" size="sm">
                      Expired
                    </Badge>
                  )}
                </Group>
                <Group gap="xs" wrap="wrap">
                  {entry.active && (
                    <Tooltip label="Report expired" withArrow>
                      <ActionIcon
                        component="a"
                        href={buildExpiredCodeUrl(entry.code)}
                        target="_blank"
                        variant="subtle"
                        color="red"
                      >
                        <IoCloseCircleOutline size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <CopyButton value={entry.code} timeout={1500}>
                    {({ copied, copy }) => (
                      <Tooltip
                        label={copied ? 'Copied!' : 'Copy code'}
                        withArrow
                      >
                        <ActionIcon
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? (
                            <IoCheckmark size={18} />
                          ) : (
                            <IoCopyOutline size={18} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                  <Checkbox
                    checked={redeemed.has(entry.code)}
                    onChange={() => toggleRedeemed(entry.code)}
                    label="Redeemed"
                    styles={{ label: { paddingLeft: 8 } }}
                  />
                </Group>
              </Group>
              {entry.reward.length > 0 && (
                <Group gap="xs" mt="xs" wrap="wrap">
                  {entry.reward.map((r) => (
                    <ResourceBadge key={r.name} name={r.name} quantity={r.quantity} />
                  ))}
                </Group>
              )}
            </Paper>
          ))}

        <Modal
          opened={markAllOpened}
          onClose={closeMarkAll}
          title="Mark all redeemed?"
          centered
        >
          <Text size="sm" mb="lg">
            This will mark all {codes.length} codes as redeemed.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeMarkAll}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                markAllRedeemed();
                closeMarkAll();
              }}
            >
              Confirm
            </Button>
          </Group>
        </Modal>

        <Modal
          opened={clearAllOpened}
          onClose={closeClearAll}
          title="Clear all redeemed?"
          centered
        >
          <Text size="sm" mb="lg">
            This will mark all codes as unredeemed.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeClearAll}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                clearAllRedeemed();
                closeClearAll();
              }}
            >
              Confirm
            </Button>
          </Group>
        </Modal>
      </Stack>
    </Container>
  );
}
