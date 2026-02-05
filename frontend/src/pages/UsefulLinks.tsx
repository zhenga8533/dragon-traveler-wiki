import { Title, Container, Stack, Card, Group, Text, Anchor, Badge, Loader, Center } from '@mantine/core';
import { FaDiscord } from 'react-icons/fa';
import { SiGooglesheets } from 'react-icons/si';
import { IoBookOutline, IoLinkOutline } from 'react-icons/io5';
import SuggestModal from '../components/SuggestModal';
import type { UsefulLink } from '../types/useful-link';
import type { IconType } from 'react-icons';
import { useDataFetch } from '../hooks/use-data-fetch';
import { LINK_JSON_TEMPLATE } from '../utils/github-issues';

const ICON_MAP: Record<string, IconType> = {
  discord: FaDiscord,
  wiki: IoBookOutline,
  spreadsheet: SiGooglesheets,
};

export default function UsefulLinks() {
  const { data: links, loading } = useDataFetch<UsefulLink[]>('data/useful-links.json', []);

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={1}>Useful Links</Title>
          <SuggestModal
            buttonLabel="Suggest a Link"
            modalTitle="Suggest a New Link"
            jsonTemplate={LINK_JSON_TEMPLATE}
            issueLabel="links"
            issueTitle="[Link] New link suggestion"
          />
        </Group>

        {loading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!loading && links.map((link) => {
          const Icon = ICON_MAP[link.icon] ?? IoLinkOutline;
          return (
          <Card key={link.link} padding="lg" radius="md" withBorder>
            <Group>
              <Text size="xl" lh={1}><Icon /></Text>
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
