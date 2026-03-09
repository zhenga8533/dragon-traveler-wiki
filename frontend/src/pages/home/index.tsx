import {
  Box,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IoCalendar, IoList, IoPricetag } from 'react-icons/io5';
import { getCardHoverProps } from '../../constants/styles';
import { useGradientAccent } from '../../hooks';
import ActiveCodesSection from './ActiveCodesSection';
import ActiveEventsSection from './ActiveEventsSection';
import DataStatsBar from './DataStatsBar';
import FeaturedCharactersMarquee from './FeaturedCharactersMarquee';
import HomeHeroSection from './HomeHeroSection';
import RecentUpdatesSection from './RecentUpdatesSection';

export default function Home() {
  const { accent } = useGradientAccent();

  return (
    <Stack gap={0}>
      <HomeHeroSection />

      {/* Content sections */}
      <Container
        size="lg"
        py={{ base: 'lg', sm: 'xl' }}
        mt={{ base: 'sm', sm: 'md' }}
      >
        <Stack gap="xl">
          {/* Featured Characters Marquee */}
          <FeaturedCharactersMarquee />

          {/* Data stats bar */}
          <DataStatsBar />

          {/* Active Codes & Recent Updates row */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Box>
              <Card
                padding="lg"
                radius="md"
                withBorder
                h="100%"
                {...getCardHoverProps()}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon
                      variant="light"
                      color={accent.primary}
                      size="lg"
                      radius="md"
                    >
                      <IoPricetag size={20} />
                    </ThemeIcon>
                    <Title order={2} size="h3">
                      Active Codes
                    </Title>
                  </Group>
                  <ActiveCodesSection />
                </Stack>
              </Card>
            </Box>

            <Box>
              <Card
                padding="lg"
                radius="md"
                withBorder
                h="100%"
                {...getCardHoverProps()}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon
                      variant="light"
                      color={accent.primary}
                      size="lg"
                      radius="md"
                    >
                      <IoList size={20} />
                    </ThemeIcon>
                    <Title order={2} size="h3">
                      Recent Updates
                    </Title>
                  </Group>
                  <RecentUpdatesSection />
                </Stack>
              </Card>
            </Box>
          </SimpleGrid>

          {/* Active Events */}
          <Card
            padding="lg"
            radius="md"
            withBorder
            {...getCardHoverProps()}
          >
            <Stack gap="md">
              <Group gap="sm">
                <ThemeIcon
                  variant="light"
                  color={accent.primary}
                  size="lg"
                  radius="md"
                >
                  <IoCalendar size={20} />
                </ThemeIcon>
                <Title order={2} size="h3">
                  Active Events
                </Title>
              </Group>
              <ActiveEventsSection />
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Stack>
  );
}
