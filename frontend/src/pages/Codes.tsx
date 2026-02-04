import { useState, useCallback } from 'react';
import {
  Title,
  Text,
  Container,
  Stack,
  Alert,
  SegmentedControl,
  Group,
  Button,
  Paper,
  ActionIcon,
  Tooltip,
  CopyButton,
  Checkbox,
  Modal,
  Loader,
  Center,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { IoCopyOutline, IoCheckmark, IoAddCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import { useDataFetch } from '../hooks/use-data-fetch';
import { GITHUB_REPO_URL } from '../constants';
import type { Code } from '../types/code';

const STORAGE_KEY = 'redeemedCodes';

function loadRedeemed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveRedeemed(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

function buildIssueUrl(params: { title: string; body: string; labels: string }) {
  return `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`;
}

const SUGGEST_URL = buildIssueUrl({
  title: '[Code] New code suggestion',
  body: '**Code:**\n`PASTE_CODE_HERE`\n\n**Source (optional):**\nWhere did you find this code?\n',
  labels: 'codes',
});

function expiredUrl(code: string) {
  return buildIssueUrl({
    title: `[Code] Report expired: ${code}`,
    body: `The code \`${code}\` appears to be expired or no longer working.\n`,
    labels: 'codes',
  });
}

type ViewFilter = 'unredeemed' | 'redeemed' | 'all';

export default function Codes() {
  const { data: codes, loading } = useDataFetch<Code[]>('data/codes.json', []);
  const [redeemed, setRedeemed] = useState<Set<string>>(loadRedeemed);
  const [view, setView] = useState<ViewFilter>('unredeemed');
  const [markAllOpened, { open: openMarkAll, close: closeMarkAll }] = useDisclosure(false);
  const [clearAllOpened, { open: openClearAll, close: closeClearAll }] = useDisclosure(false);

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

  const filtered = codes.filter((entry) => {
    if (view === 'redeemed') return redeemed.has(entry.code);
    if (view === 'unredeemed') return !redeemed.has(entry.code);
    return true;
  });

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Codes</Title>
          <Button
            component="a"
            href={SUGGEST_URL}
            target="_blank"
            variant="light"
            size="xs"
            leftSection={<IoAddCircleOutline size={16} />}
          >
            Suggest a Code
          </Button>
        </Group>

        <Alert
          icon={<IoInformationCircleOutline size={20} />}
          title="How to redeem"
          variant="light"
        >
          <Text size="sm">
            Codes are redeemed in-game via <strong>Settings &gt; Redeem Code</strong>.
            Each code can only be used once per account.
            Codes are case-sensitive and must be entered without leading or trailing spaces.
          </Text>
        </Alert>

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
            <Button size="xs" variant="light" color="gray" onClick={openClearAll}>
              Clear All Redeemed
            </Button>
          </Group>
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && filtered.length === 0 && (
          <Text c="dimmed" ta="center" py="lg">
            {view === 'redeemed'
              ? 'No codes marked as redeemed yet.'
              : view === 'unredeemed'
                ? 'All codes have been redeemed!'
                : 'No codes available.'}
          </Text>
        )}

        {!loading && filtered.map((entry) => (
          <Paper
            key={entry.code}
            p="sm"
            radius="md"
            withBorder
            opacity={entry.active ? 1 : 0.5}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Text ff="monospace" fw={500} size="lg" td={entry.active ? undefined : 'line-through'}>
                  {entry.code}
                </Text>
                {!entry.active && (
                  <Badge color="red" variant="light" size="sm">Expired</Badge>
                )}
              </Group>
              <Group gap="xs" wrap="nowrap">
                {entry.active && (
                  <Tooltip label="Report expired" withArrow>
                    <ActionIcon
                      component="a"
                      href={expiredUrl(entry.code)}
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
                    <Tooltip label={copied ? 'Copied!' : 'Copy code'} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color={copied ? 'teal' : 'gray'}
                        onClick={copy}
                      >
                        {copied ? <IoCheckmark size={18} /> : <IoCopyOutline size={18} />}
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
          </Paper>
        ))}

        <Modal opened={markAllOpened} onClose={closeMarkAll} title="Mark all redeemed?" centered>
          <Text size="sm" mb="lg">
            This will mark all {codes.length} codes as redeemed.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeMarkAll}>Cancel</Button>
            <Button onClick={() => { markAllRedeemed(); closeMarkAll(); }}>Confirm</Button>
          </Group>
        </Modal>

        <Modal opened={clearAllOpened} onClose={closeClearAll} title="Clear all redeemed?" centered>
          <Text size="sm" mb="lg">
            This will mark all codes as unredeemed.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeClearAll}>Cancel</Button>
            <Button color="red" onClick={() => { clearAllRedeemed(); closeClearAll(); }}>Confirm</Button>
          </Group>
        </Modal>
      </Stack>
    </Container>
  );
}
