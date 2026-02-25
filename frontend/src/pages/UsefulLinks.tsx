import {
  Anchor,
  Badge,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { IconType } from 'react-icons';
import { FaDiscord } from 'react-icons/fa';
import { IoBookOutline, IoLinkOutline } from 'react-icons/io5';
import { SiGooglesheets } from 'react-icons/si';
import { ListPageLoading } from '../components/layout/PageLoadingSkeleton';
import SuggestModal, { type FieldDef } from '../components/tools/SuggestModal';
import { useDataFetch } from '../hooks/use-data-fetch';
import type { UsefulLink } from '../types/useful-link';

const LINK_FIELDS: FieldDef[] = [
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    options: ['discord', 'wiki', 'spreadsheet'],
  },
  {
    name: 'application',
    label: 'Application',
    type: 'text',
    required: true,
    placeholder: 'e.g. Discord, Google Sheets, Website',
  },
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Link name',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Brief description',
  },
  {
    name: 'link',
    label: 'URL',
    type: 'text',
    required: true,
    placeholder: 'https://example.com',
  },
];

const ICON_MAP: Record<string, IconType> = {
  discord: FaDiscord,
  wiki: IoBookOutline,
  spreadsheet: SiGooglesheets,
};

export default function UsefulLinks() {
  const { data: links, loading } = useDataFetch<UsefulLink[]>(
    'data/useful-links.json',
    []
  );

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Useful Links</Title>
          <SuggestModal
            buttonLabel="Suggest a Link"
            modalTitle="Suggest a New Link"
            issueTitle="[Link] New link suggestion"
            fields={LINK_FIELDS}
          />
        </Group>

        {loading && <ListPageLoading cards={4} />}

        {!loading &&
          links.map((link) => {
            const Icon = ICON_MAP[link.icon] ?? IoLinkOutline;
            return (
              <Card key={link.link} padding="lg" radius="md" withBorder>
                <Group>
                  <Text size="xl" lh={1}>
                    <Icon />
                  </Text>
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb={4}>
                      <Anchor href={link.link} target="_blank" fw={600}>
                        {link.name}
                      </Anchor>
                      <Badge variant="light" size="sm">
                        {link.application}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {link.description}
                    </Text>
                  </div>
                </Group>
              </Card>
            );
          })}
      </Stack>
    </Container>
  );
}
