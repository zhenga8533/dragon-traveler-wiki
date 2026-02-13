import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Checkbox,
  Collapse,
  Container,
  CopyButton,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IoCheckmark,
  IoChevronDown,
  IoChevronUp,
  IoCloseCircleOutline,
  IoCopyOutline,
  IoGift,
  IoInformationCircleOutline,
  IoSearch,
  IoTrophy,
} from 'react-icons/io5';
import { ListPageLoading } from '../components/PageLoadingSkeleton';
import PaginationControl from '../components/PaginationControl';
import ResourceBadge from '../components/ResourceBadge';
import SuggestModal, { type FieldDef } from '../components/SuggestModal';
import ViewToggle from '../components/ViewToggle';
import { IMAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch } from '../hooks/use-data-fetch';
import { useViewMode } from '../hooks/use-filters';
import type { Code } from '../types/code';
import { buildExpiredCodeUrl } from '../utils/github-issues';

function aggregateRewards(codes: Code[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const code of codes) {
    const rewards = code.rewards ?? code.reward ?? [];
    for (const r of rewards) {
      totals.set(r.name, (totals.get(r.name) || 0) + r.quantity);
    }
  }
  return totals;
}

const CODE_FIELDS: FieldDef[] = [
  {
    name: 'code',
    label: 'Code',
    type: 'text',
    required: true,
    placeholder: 'e.g. DRAGONCODE123',
  },
  {
    name: 'source',
    label: 'Source (optional)',
    type: 'text',
    placeholder: 'Where did you find this code?',
  },
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
const CODES_PER_PAGE = 20;

export default function Codes() {
  const { data: codes, loading } = useDataFetch<Code[]>('data/codes.json', []);
  const [redeemed, setRedeemed] = useState<Set<string>>(() => loadRedeemed());
  const [view, setView] = useState<ViewFilter>('unredeemed');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.CODES_VIEW_MODE,
    defaultMode: 'list',
  });
  const [rewardsOpen, { toggle: toggleRewards }] = useDisclosure(
    (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY.CODES_REWARDS_OPEN);
        return stored !== null ? stored === 'true' : true;
      } catch {
        return true;
      }
    })()
  );
  const [markAllOpened, { open: openMarkAll, close: closeMarkAll }] =
    useDisclosure(false);
  const [clearAllOpened, { open: openClearAll, close: closeClearAll }] =
    useDisclosure(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY.CODES_REWARDS_OPEN, String(rewardsOpen));
    } catch {
      /* ignore */
    }
  }, [rewardsOpen]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, view, redeemed]);

  const totalPages = Math.ceil(filtered.length / CODES_PER_PAGE);
  const paginatedCodes = filtered.slice(
    (currentPage - 1) * CODES_PER_PAGE,
    currentPage * CODES_PER_PAGE
  );

  const unclaimedRewards = useMemo(
    () =>
      aggregateRewards(codes.filter((c) => c.active && !redeemed.has(c.code))),
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
          <Group gap="xs">
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as ViewFilter)}
              data={[
                { label: 'Unredeemed', value: 'unredeemed' },
                { label: 'Redeemed', value: 'redeemed' },
                { label: 'All', value: 'all' },
              ]}
            />
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </Group>
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

        {!loading && (
          <Paper p="sm" radius="md" withBorder>
            <Group
              justify="space-between"
              align="center"
              onClick={toggleRewards}
              style={{ cursor: 'pointer' }}
            >
              <Text fw={500} size="sm">
                Reward Summary
              </Text>
              {rewardsOpen ? (
                <IoChevronUp size={16} />
              ) : (
                <IoChevronDown size={16} />
              )}
            </Group>
            <Collapse in={rewardsOpen}>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="sm">
                <Alert
                  icon={<IoGift size={20} />}
                  title="Total Unclaimed Rewards"
                  color="yellow"
                  variant="light"
                  radius="md"
                >
                  {unclaimedRewards.size > 0 ? (
                    <Group gap="xs" wrap="wrap" mt={4}>
                      {[...unclaimedRewards.entries()].map(([name, qty]) => (
                        <ResourceBadge key={name} name={name} quantity={qty} />
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" mt={4}>
                      No unclaimed rewards — you've redeemed everything!
                    </Text>
                  )}
                </Alert>
                <Alert
                  icon={<IoTrophy size={20} />}
                  title="Total Claimed Rewards"
                  color="teal"
                  variant="light"
                  radius="md"
                >
                  {claimedRewards.size > 0 ? (
                    <Group gap="xs" wrap="wrap" mt={4}>
                      {[...claimedRewards.entries()].map(([name, qty]) => (
                        <ResourceBadge key={name} name={name} quantity={qty} />
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" mt={4}>
                      No claimed rewards yet — start redeeming codes!
                    </Text>
                  )}
                </Alert>
              </SimpleGrid>
            </Collapse>
          </Paper>
        )}

        {loading && <ListPageLoading cards={5} />}

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
          viewMode === 'list' &&
          paginatedCodes.map((entry) => (
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
              {(entry.rewards ?? entry.reward ?? []).length > 0 && (
                <Group gap="xs" mt="xs" wrap="wrap">
                  {(entry.rewards ?? entry.reward ?? []).map((r) => (
                    <ResourceBadge
                      key={r.name}
                      name={r.name}
                      quantity={r.quantity}
                    />
                  ))}
                </Group>
              )}
            </Paper>
          ))}

        {!loading && viewMode === 'grid' && paginatedCodes.length > 0 && (
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
            {paginatedCodes.map((entry) => (
              <Paper
                key={entry.code}
                p="md"
                radius="md"
                withBorder
                opacity={entry.active ? 1 : 0.5}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Text
                        ff="monospace"
                        fw={500}
                        size="md"
                        td={entry.active ? undefined : 'line-through'}
                      >
                        {entry.code}
                      </Text>
                      {!entry.active && (
                        <Badge color="red" variant="light" size="xs">
                          Expired
                        </Badge>
                      )}
                    </Group>
                    <Group gap={4}>
                      {entry.active && (
                        <Tooltip label="Report expired" withArrow>
                          <ActionIcon
                            component="a"
                            href={buildExpiredCodeUrl(entry.code)}
                            target="_blank"
                            variant="subtle"
                            color="red"
                            size="sm"
                          >
                            <IoCloseCircleOutline size={16} />
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
                              size="sm"
                            >
                              {copied ? (
                                <IoCheckmark size={16} />
                              ) : (
                                <IoCopyOutline size={16} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>
                  </Group>

                  {(entry.rewards ?? entry.reward ?? []).length > 0 && (
                    <Group gap="xs" wrap="wrap">
                      {(entry.rewards ?? entry.reward ?? []).map((r) => (
                        <ResourceBadge
                          key={r.name}
                          name={r.name}
                          quantity={r.quantity}
                        />
                      ))}
                    </Group>
                  )}

                  <Checkbox
                    checked={redeemed.has(entry.code)}
                    onChange={() => toggleRedeemed(entry.code)}
                    label="Redeemed"
                    styles={{ label: { paddingLeft: 8 } }}
                  />
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        )}

        {!loading && (
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        )}

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
