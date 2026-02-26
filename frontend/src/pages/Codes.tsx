import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Checkbox,
  Collapse,
  Container,
  CopyButton,
  Divider,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
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
  IoStatsChart,
  IoTrophy,
} from 'react-icons/io5';
import { getResourceIcon } from '../assets/resource';
import DataFetchError from '../components/common/DataFetchError';
import LastUpdated from '../components/common/LastUpdated';
import NoResultsSuggestions from '../components/common/NoResultsSuggestions';
import PaginationControl from '../components/common/PaginationControl';
import ResourceBadge from '../components/common/ResourceBadge';
import ViewToggle from '../components/common/ViewToggle';
import { ViewModeLoading } from '../components/layout/PageLoadingSkeleton';
import SuggestModal, {
  type ArrayFieldDef,
  type FieldDef,
} from '../components/tools/SuggestModal';
import { CURSOR_POINTER_STYLE } from '../constants/styles';
import { IMAGE_SIZE, STORAGE_KEY } from '../constants/ui';
import { useDataFetch, useMobileTooltip } from '../hooks';
import { useViewMode } from '../hooks/use-filters';
import { usePagination } from '../hooks/use-pagination';
import type { Code } from '../types/code';
import type { Resource } from '../types/resource';
import {
  buildExpiredCodeUrl,
  getLatestTimestamp,
  isCodeActive,
  isCodeExpired,
} from '../utils';

function aggregateRewards(codes: Code[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const code of codes) {
    for (const [name, qty] of Object.entries(code.rewards ?? {})) {
      totals.set(name, (totals.get(name) || 0) + qty);
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

function buildCodeRewardArrayFields(resources: Resource[]): ArrayFieldDef[] {
  const resourceNames = resources.map((r) => r.name).sort();
  const resourceIcons: Record<string, string> = {};
  for (const resource of resources) {
    const icon = getResourceIcon(resource.name);
    if (icon) {
      resourceIcons[resource.name] = icon;
    }
  }

  return [
    {
      name: 'rewards',
      label: 'Rewards',
      toDict: { key: 'name', value: 'quantity' },
      fields: [
        {
          name: 'name',
          label: 'Reward Name',
          type: 'select',
          required: true,
          placeholder: 'Select a resource',
          options: resourceNames,
          optionIcons: resourceIcons,
        },
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'text',
          required: true,
          placeholder: 'e.g. 500',
        },
      ],
    },
  ];
}

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
  window.dispatchEvent(new Event('redeemed-codes-updated'));
}

type ViewFilter = 'unredeemed' | 'redeemed' | 'all';
type TabFilter = 'active' | 'expired';
const CODES_PER_PAGE = 20;

export default function Codes() {
  const tooltipProps = useMobileTooltip();
  const {
    data: codes,
    loading,
    error,
  } = useDataFetch<Code[]>('data/codes.json', []);
  const { data: resources } = useDataFetch<Resource[]>(
    'data/resources.json',
    []
  );
  const [redeemed, setRedeemed] = useState<Set<string>>(() => loadRedeemed());
  const [view, setView] = useState<ViewFilter>('unredeemed');
  const [tab, setTab] = useState<TabFilter>('active');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.CODES_VIEW_MODE,
    defaultMode: 'list',
  });
  const [rewardsOpen, { toggle: toggleRewards }] = useDisclosure(
    (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY.CODES_REWARDS_OPEN);
        return stored !== null ? stored === 'true' : false;
      } catch {
        return false;
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

  const filtered = useMemo(
    () =>
      codes.filter((entry) => {
        // Filter by active/expired tab
        if (tab === 'active' && isCodeExpired(entry)) return false;
        if (tab === 'expired' && isCodeActive(entry)) return false;

        // Filter by redeemed status
        if (view === 'redeemed' && !redeemed.has(entry.code)) return false;
        if (view === 'unredeemed' && redeemed.has(entry.code)) return false;

        // Filter by search
        if (search && !entry.code.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [codes, tab, view, redeemed, search]
  );

  const markAllRedeemed = useCallback(() => {
    setRedeemed((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.add(c.code));
      saveRedeemed(next);
      return next;
    });
    notifications.show({
      title: 'Codes marked as redeemed',
      message: `Marked ${filtered.length} codes as redeemed.`,
      color: 'teal',
    });
  }, [filtered]);

  const clearAllRedeemed = useCallback(() => {
    setRedeemed((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.delete(c.code));
      saveRedeemed(next);
      return next;
    });
    notifications.show({
      title: 'Redeemed status cleared',
      message: `Marked ${filtered.length} codes as unredeemed.`,
      color: 'gray',
    });
  }, [filtered]);

  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    CODES_PER_PAGE,
    JSON.stringify({
      search,
      view,
      tab,
      redeemed: [...redeemed].sort(),
    })
  );
  const paginatedCodes = filtered.slice(offset, offset + CODES_PER_PAGE);

  const unclaimedRewards = useMemo(
    () =>
      aggregateRewards(
        codes.filter((c) => isCodeActive(c) && !redeemed.has(c.code))
      ),
    [codes, redeemed]
  );

  const claimedRewards = useMemo(
    () => aggregateRewards(codes.filter((c) => redeemed.has(c.code))),
    [codes, redeemed]
  );

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(codes), [codes]);

  const codeRewardArrayFields = useMemo(
    () => buildCodeRewardArrayFields(resources),
    [resources]
  );

  const tabCodeCount = filtered.length;

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Codes</Title>
            <LastUpdated timestamp={mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Code"
            modalTitle="Suggest a New Code"
            issueTitle="[Code] New code suggestion"
            fields={CODE_FIELDS}
            arrayFields={codeRewardArrayFields}
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

        <Tabs value={tab} onChange={(v) => setTab(v as TabFilter)}>
          <Tabs.List>
            <Tabs.Tab value="active">Active Codes</Tabs.Tab>
            <Tabs.Tab value="expired">Expired Codes</Tabs.Tab>
          </Tabs.List>
        </Tabs>

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

        {!loading && error && (
          <DataFetchError
            title="Could not load codes"
            message={error.message}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && (
          <Paper p="sm" radius="md" withBorder>
            <Group
              justify="space-between"
              align="center"
              onClick={toggleRewards}
              style={CURSOR_POINTER_STYLE}
              px="xs"
              py={4}
            >
              <Group gap="sm">
                <ThemeIcon variant="light" color="violet" size="md" radius="md">
                  <IoStatsChart size={14} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  Reward Summary
                </Text>
              </Group>
              {rewardsOpen ? (
                <IoChevronUp size={16} />
              ) : (
                <IoChevronDown size={16} />
              )}
            </Group>
            <Collapse in={rewardsOpen}>
              <Divider mt="sm" mb="md" />
              <Group align="flex-start" gap={0} wrap="wrap">
                <Stack gap="xs" style={{ flex: '1 1 220px' }}>
                  <Group gap="xs">
                    <ThemeIcon
                      variant="light"
                      color="yellow"
                      size="sm"
                      radius="sm"
                    >
                      <IoGift size={12} />
                    </ThemeIcon>
                    <Text size="sm" fw={600}>
                      Unclaimed
                    </Text>
                    {unclaimedRewards.size > 0 && (
                      <Badge variant="light" color="yellow" size="xs">
                        {unclaimedRewards.size} types
                      </Badge>
                    )}
                  </Group>
                  {unclaimedRewards.size > 0 ? (
                    <Group gap="xs" wrap="wrap">
                      {[...unclaimedRewards.entries()].map(([name, qty]) => (
                        <ResourceBadge key={name} name={name} quantity={qty} />
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">
                      Nothing left to claim!
                    </Text>
                  )}
                </Stack>

                <Divider
                  orientation="vertical"
                  mx="lg"
                  visibleFrom="sm"
                  style={{ alignSelf: 'stretch' }}
                />
                <Divider hiddenFrom="sm" w="100%" my="sm" />

                <Stack gap="xs" style={{ flex: '1 1 220px' }}>
                  <Group gap="xs">
                    <ThemeIcon
                      variant="light"
                      color="teal"
                      size="sm"
                      radius="sm"
                    >
                      <IoTrophy size={12} />
                    </ThemeIcon>
                    <Text size="sm" fw={600}>
                      Claimed
                    </Text>
                    {claimedRewards.size > 0 && (
                      <Badge variant="light" color="teal" size="xs">
                        {claimedRewards.size} types
                      </Badge>
                    )}
                  </Group>
                  {claimedRewards.size > 0 ? (
                    <Group gap="xs" wrap="wrap">
                      {[...claimedRewards.entries()].map(([name, qty]) => (
                        <ResourceBadge key={name} name={name} quantity={qty} />
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">
                      No codes redeemed yet.
                    </Text>
                  )}
                </Stack>
              </Group>
            </Collapse>
          </Paper>
        )}

        {loading && (
          <ViewModeLoading viewMode={viewMode} cards={5} cardHeight={180} />
        )}

        {!loading && !error && filtered.length === 0 && (
          <NoResultsSuggestions
            title="No codes found"
            message={
              search
                ? 'No codes match your search.'
                : tab === 'expired'
                  ? view === 'redeemed'
                    ? 'No expired codes marked as redeemed.'
                    : view === 'unredeemed'
                      ? 'No unredeemed expired codes.'
                      : 'No expired codes yet.'
                  : view === 'redeemed'
                    ? 'No active codes marked as redeemed yet.'
                    : view === 'unredeemed'
                      ? 'All active codes have been redeemed!'
                      : 'No active codes available.'
            }
            onReset={() => {
              setSearch('');
              setView('all');
            }}
            resetLabel="Reset search & view"
          />
        )}

        {!loading &&
          !error &&
          viewMode === 'list' &&
          paginatedCodes.map((entry) => {
            const isActiveCode = isCodeActive(entry);
            return (
              <Paper
                key={entry.code}
                p="sm"
                radius="md"
                withBorder
                opacity={isActiveCode ? 1 : 0.5}
              >
                <Group justify="space-between" wrap="wrap" align="center">
                  <Group
                    gap="sm"
                    wrap="wrap"
                    style={{ flex: 1, minWidth: 200 }}
                  >
                    <Text
                      ff="monospace"
                      fw={500}
                      size="lg"
                      td={isActiveCode ? undefined : 'line-through'}
                    >
                      {entry.code}
                    </Text>
                    {!isActiveCode && (
                      <Badge color="red" variant="light" size="sm">
                        Expired
                      </Badge>
                    )}
                  </Group>
                  <Group gap="xs" wrap="wrap">
                    {isActiveCode && (
                      <Tooltip label="Report expired" {...tooltipProps}>
                        <ActionIcon
                          component="a"
                          href={buildExpiredCodeUrl(entry.code)}
                          target="_blank"
                          variant="subtle"
                          color="red"
                          aria-label="Report expired"
                        >
                          <IoCloseCircleOutline size={18} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    <CopyButton value={entry.code} timeout={1500}>
                      {({ copied, copy }) => (
                        <Tooltip
                          label={copied ? 'Copied!' : 'Copy code'}
                          {...tooltipProps}
                        >
                          <ActionIcon
                            variant="subtle"
                            color={copied ? 'teal' : 'gray'}
                            onClick={copy}
                            aria-label={copied ? 'Copied!' : 'Copy code'}
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
                {Object.keys(entry.rewards ?? {}).length > 0 && (
                  <Group gap="xs" mt="xs" wrap="wrap">
                    {Object.entries(entry.rewards ?? {}).map(([name, qty]) => (
                      <ResourceBadge key={name} name={name} quantity={qty} />
                    ))}
                  </Group>
                )}
              </Paper>
            );
          })}

        {!loading &&
          !error &&
          viewMode === 'grid' &&
          paginatedCodes.length > 0 && (
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
              {paginatedCodes.map((entry) => {
                const isActiveCode = isCodeActive(entry);
                return (
                  <Paper
                    key={entry.code}
                    p="md"
                    radius="md"
                    withBorder
                    opacity={isActiveCode ? 1 : 0.5}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="center">
                        <Group gap="xs">
                          <Text
                            ff="monospace"
                            fw={500}
                            size="md"
                            td={isActiveCode ? undefined : 'line-through'}
                          >
                            {entry.code}
                          </Text>
                          {!isActiveCode && (
                            <Badge color="red" variant="light" size="xs">
                              Expired
                            </Badge>
                          )}
                        </Group>
                        <Group gap={4}>
                          {isActiveCode && (
                            <Tooltip label="Report expired" {...tooltipProps}>
                              <ActionIcon
                                component="a"
                                href={buildExpiredCodeUrl(entry.code)}
                                target="_blank"
                                variant="subtle"
                                color="red"
                                size="sm"
                                aria-label="Report expired"
                              >
                                <IoCloseCircleOutline size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <CopyButton value={entry.code} timeout={1500}>
                            {({ copied, copy }) => (
                              <Tooltip
                                label={copied ? 'Copied!' : 'Copy code'}
                                {...tooltipProps}
                              >
                                <ActionIcon
                                  variant="subtle"
                                  color={copied ? 'teal' : 'gray'}
                                  onClick={copy}
                                  size="sm"
                                  aria-label={copied ? 'Copied!' : 'Copy code'}
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

                      {Object.keys(entry.rewards ?? {}).length > 0 && (
                        <Group gap="xs" wrap="wrap">
                          {Object.entries(entry.rewards ?? {}).map(
                            ([name, quantity]) => (
                              <ResourceBadge
                                key={name}
                                name={name}
                                quantity={quantity}
                              />
                            )
                          )}
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
                );
              })}
            </SimpleGrid>
          )}

        {!loading && !error && (
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        )}

        <Modal
          opened={markAllOpened}
          onClose={closeMarkAll}
          title="Mark all redeemed?"
          centered
        >
          <Text size="sm" mb="lg">
            This will mark {tabCodeCount} matching codes as redeemed.
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
            This will mark {tabCodeCount} matching codes as unredeemed.
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
