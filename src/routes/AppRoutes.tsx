import {
  BuilderPageLoading,
  CardGridLoading,
  CharacterDetailPageLoading,
  CharacterListLoading,
  ContentPageLoading,
  DetailPageLoading,
  EventCardsLoading,
  HomePageLoading,
  ListRouteLoading,
  ListPageLoading,
  ViewModeLoading,
} from '@/components/layout/PageLoadingSkeleton';
import { Container, Group, Skeleton, Stack } from '@mantine/core';
import { isDetailRoute } from '@/constants/route-meta';
import { STORAGE_KEY } from '@/constants/ui';
import { lazy, Suspense } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router';

const Home = lazy(() => import('@/pages/home/Page'));
const Artifacts = lazy(() => import('@/pages/artifacts/ListPage'));
const ArtifactPage = lazy(() => import('@/pages/artifacts/DetailPage'));
const Characters = lazy(() => import('@/pages/characters/ListPage'));
const CharacterPage = lazy(() => import('@/pages/characters/DetailPage'));
const GearPage = lazy(() => import('@/pages/gear/ListPage'));
const GearSetPage = lazy(() => import('@/pages/gear/DetailPage'));
const RelicPage = lazy(() => import('@/pages/relics/ListPage'));
const OracleScrollPage = lazy(() => import('@/pages/relics/DetailPage'));
const Howlkins = lazy(() => import('@/pages/howlkins/ListPage'));
const GoldenAlliancePage = lazy(() => import('@/pages/howlkins/DetailPage'));
const NoblePhantasms = lazy(() => import('@/pages/noble-phantasms/ListPage'));
const NoblePhantasmPage = lazy(
  () => import('@/pages/noble-phantasms/DetailPage')
);
const Resources = lazy(() => import('@/pages/resources/Page'));
const Subclasses = lazy(() => import('@/pages/subclasses/ListPage'));
const StatusEffects = lazy(() => import('@/pages/status-effects/ListPage'));
const DragonSpells = lazy(() => import('@/pages/wyrmspells/ListPage'));
const WyrmspellPage = lazy(() => import('@/pages/wyrmspells/DetailPage'));
const WyrmsListPage = lazy(() => import('@/pages/wyrms/ListPage'));
const WyrmPage = lazy(() => import('@/pages/wyrms/DetailPage'));
const TierList = lazy(() => import('@/pages/tier-list/Page'));
const Teams = lazy(() => import('@/pages/teams/ListPage'));
const TeamPage = lazy(() => import('@/pages/teams/TeamPage'));
const SavedTeamPage = lazy(() => import('@/pages/teams/SavedTeamPage'));
const Codes = lazy(() => import('@/pages/codes/Page'));
const Events = lazy(() => import('@/pages/events/Page'));
const UsefulLinks = lazy(() => import('@/pages/useful-links/Page'));
const Changelog = lazy(() => import('@/pages/changelog/Page'));
const BeginnerQA = lazy(() => import('@/pages/guides/BeginnerQA'));
const FAQ = lazy(() => import('@/pages/faq/Page'));
const StarUpgradeCalculator = lazy(
  () => import('@/pages/guides/StarUpgradeCalculator')
);
const MythicSummonCalculator = lazy(
  () => import('@/pages/guides/MythicSummonCalculator')
);
const DiamondCalculator = lazy(
  () => import('@/pages/guides/DiamondCalculator')
);
const ShovelEventGuide = lazy(() => import('@/pages/guides/ShovelEventGuide'));
const Dtdle = lazy(() => import('@/pages/guides/Dtdle'));
const NotFound = lazy(() => import('@/pages/not-found/Page'));

function GuidesLegacyRedirect() {
  const { '*': rest } = useParams();
  return <Navigate to={`/toolbox/${rest}`} replace />;
}

function CharacterListRouteFallback() {
  const viewMode = getStoredViewMode(STORAGE_KEY.CHARACTER_VIEW_MODE, 'grid');

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Skeleton height={42} width={190} radius="md" aria-hidden="true" />
          <Group gap="xs" aria-hidden="true">
            <Skeleton height={30} width={110} radius="md" />
            <Skeleton height={30} width={72} radius="md" />
            <Skeleton height={30} width={72} radius="md" />
          </Group>
        </Group>
        <CharacterListLoading viewMode={viewMode} />
      </Stack>
    </Container>
  );
}

type ViewMode = 'grid' | 'list';

function getStoredViewMode(storageKey: string, fallback: ViewMode): ViewMode {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(storageKey);
  return stored === 'grid' || stored === 'list' ? stored : fallback;
}

function getRouteTab(search: string, fallback: string, validTabs: string[]) {
  const tab = new URLSearchParams(search).get('tab');
  return tab && validTabs.includes(tab) ? tab : fallback;
}

function FilteredListRouteFallback({
  storageKey,
  defaultViewMode,
  tabs = 0,
}: {
  storageKey: string;
  defaultViewMode: ViewMode;
  tabs?: number;
}) {
  const viewMode = getStoredViewMode(storageKey, defaultViewMode);
  return (
    <ListRouteLoading tabs={tabs}>
      <ViewModeLoading
        viewMode={viewMode}
        listType="table"
        withToolbar
        showPagination
      />
    </ListRouteLoading>
  );
}

function RouteFallback() {
  const { pathname, search } = useLocation();
  if (pathname === '/') {
    return <HomePageLoading />;
  }

  if (pathname === '/characters') {
    return <CharacterListRouteFallback />;
  }

  if (pathname.startsWith('/characters/')) {
    return <CharacterDetailPageLoading />;
  }

  const isDetail = isDetailRoute(pathname);
  if (isDetail) return <DetailPageLoading />;

  if (pathname === '/artifacts') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.ARTIFACT_VIEW_MODE}
        defaultViewMode="grid"
      />
    );
  }

  if (pathname === '/wyrmspells') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.WYRMSPELL_VIEW_MODE}
        defaultViewMode="grid"
      />
    );
  }

  if (pathname === '/wyrms') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.WYRM_VIEW_MODE}
        defaultViewMode="grid"
      />
    );
  }

  if (pathname === '/resources') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.RESOURCE_VIEW_MODE}
        defaultViewMode="list"
      />
    );
  }

  if (pathname === '/status-effects') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.STATUS_EFFECT_VIEW_MODE}
        defaultViewMode="list"
      />
    );
  }

  if (pathname === '/subclasses') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.SUBCLASS_VIEW_MODE}
        defaultViewMode="list"
      />
    );
  }

  if (pathname === '/gear') {
    const tab = getRouteTab(search, 'gear', ['gear', 'gear-sets', 'usage']);
    const content =
      tab === 'gear-sets' ? (
        <CardGridLoading cardHeight={180} showPagination />
      ) : tab === 'usage' ? (
        <ViewModeLoading
          viewMode="list"
          listType="table"
          withToolbar
          showPagination
        />
      ) : (
        <ViewModeLoading
          viewMode={getStoredViewMode(STORAGE_KEY.GEAR_VIEW_MODE, 'grid')}
          listType="table"
          withToolbar
          showPagination
        />
      );
    return <ListRouteLoading tabs={3}>{content}</ListRouteLoading>;
  }

  if (pathname === '/relics') {
    const tab = getRouteTab(search, 'relics', ['relics', 'oracle-scrolls']);
    return (
      <ListRouteLoading tabs={2}>
        {tab === 'oracle-scrolls' ? (
          <CardGridLoading cardHeight={160} showPagination />
        ) : (
          <ViewModeLoading
            viewMode={getStoredViewMode(STORAGE_KEY.RELIC_VIEW_MODE, 'grid')}
            listType="table"
            withToolbar
            showPagination
          />
        )}
      </ListRouteLoading>
    );
  }

  if (pathname === '/howlkins') {
    const tab = getRouteTab(search, 'howlkins', [
      'howlkins',
      'golden-alliances',
    ]);
    return (
      <ListRouteLoading tabs={2}>
        {tab === 'golden-alliances' ? (
          <CardGridLoading cardHeight={180} showPagination />
        ) : (
          <ViewModeLoading
            viewMode={getStoredViewMode(STORAGE_KEY.HOWLKIN_VIEW_MODE, 'grid')}
            cardHeight={180}
            listType="table"
            withToolbar
            showPagination
          />
        )}
      </ListRouteLoading>
    );
  }

  if (pathname === '/noble-phantasms') {
    const tab = getRouteTab(search, 'noble-phantasms', [
      'noble-phantasms',
      'usage',
    ]);
    return (
      <ListRouteLoading tabs={2}>
        <ViewModeLoading
          viewMode={
            tab === 'usage'
              ? 'list'
              : getStoredViewMode(
                  STORAGE_KEY.NOBLE_PHANTASM_VIEW_MODE,
                  'grid'
                )
          }
          listType="table"
          withToolbar
          showPagination
        />
      </ListRouteLoading>
    );
  }

  if (pathname === '/events') {
    return (
      <ListRouteLoading containerSize="lg" tabs={2}>
        <EventCardsLoading
          viewMode={getStoredViewMode(STORAGE_KEY.EVENT_VIEW_MODE, 'grid')}
          showPagination
        />
      </ListRouteLoading>
    );
  }

  if (pathname === '/codes') {
    return (
      <ListRouteLoading tabs={2}>
        <ViewModeLoading
          viewMode={getStoredViewMode(STORAGE_KEY.CODES_VIEW_MODE, 'list')}
          cards={9}
          gridCols={{ base: 1, xs: 2, sm: 3 }}
          cardHeight={180}
          showPagination
          label="Loading codes"
        />
      </ListRouteLoading>
    );
  }

  if (pathname === '/teams' || pathname === '/tier-list') {
    const mode = new URLSearchParams(search).get('mode');
    const isTeams = pathname === '/teams';
    const viewMode = getStoredViewMode(
      isTeams ? STORAGE_KEY.TEAMS_VIEW_MODE : STORAGE_KEY.TIER_LIST_VIEW_MODE,
      'grid'
    );
    return (
      <ListRouteLoading containerSize="lg">
        <Stack gap="md">
          <Skeleton height={36} radius="md" aria-hidden="true" />
          {mode === 'builder' ? (
            <BuilderPageLoading />
          ) : (
            <ViewModeLoading
              viewMode={viewMode}
              cardHeight={isTeams ? 200 : 180}
              showPagination
              label={isTeams ? 'Loading teams' : 'Loading tier lists'}
            />
          )}
        </Stack>
      </ListRouteLoading>
    );
  }

  if (pathname === '/changelog') {
    const tab = getRouteTab(search, 'site', ['site', 'data']);
    return (
      <ListRouteLoading tabs={2} description actions={false}>
        {tab === 'data' ? (
          <ListPageLoading showPagination />
        ) : (
          <ViewModeLoading
            viewMode="list"
            showPagination
            label="Loading updates"
          />
        )}
      </ListRouteLoading>
    );
  }

  if (pathname === '/toolbox/useful-links') {
    return (
      <ListRouteLoading>
        <ViewModeLoading viewMode="list" />
      </ListRouteLoading>
    );
  }

  return <ContentPageLoading />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artifacts" element={<Artifacts />} />
        <Route path="/artifacts/:name" element={<ArtifactPage />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/characters/:name" element={<CharacterPage />} />
        <Route path="/gear" element={<GearPage />} />
        <Route path="/gear-sets/:setName" element={<GearSetPage />} />
        <Route path="/relics" element={<RelicPage />} />
        <Route
          path="/oracle-scrolls/:scrollName"
          element={<OracleScrollPage />}
        />
        <Route path="/howlkins" element={<Howlkins />} />
        <Route
          path="/howlkins/:allianceSlug"
          element={<GoldenAlliancePage />}
        />
        <Route path="/noble-phantasms" element={<NoblePhantasms />} />
        <Route path="/noble-phantasms/:name" element={<NoblePhantasmPage />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/subclasses" element={<Subclasses />} />
        <Route path="/status-effects" element={<StatusEffects />} />
        <Route path="/wyrmspells" element={<DragonSpells />} />
        <Route path="/wyrmspells/:name" element={<WyrmspellPage />} />
        <Route path="/wyrms" element={<WyrmsListPage />} />
        <Route path="/wyrms/:name" element={<WyrmPage />} />
        <Route path="/tier-list" element={<TierList />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/saved/:teamSlug" element={<SavedTeamPage />} />
        <Route path="/teams/:teamName" element={<TeamPage />} />
        <Route path="/codes" element={<Codes />} />
        <Route path="/events" element={<Events />} />
        <Route path="/toolbox/useful-links" element={<UsefulLinks />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/toolbox/faq" element={<FAQ />} />
        <Route path="/toolbox/beginner-qa" element={<BeginnerQA />} />
        <Route
          path="/toolbox/star-upgrade-calculator"
          element={<StarUpgradeCalculator />}
        />
        <Route
          path="/toolbox/mythic-summon-calculator"
          element={<MythicSummonCalculator />}
        />
        <Route
          path="/toolbox/diamond-calculator"
          element={<DiamondCalculator />}
        />
        <Route path="/toolbox/shovel-event" element={<ShovelEventGuide />} />
        <Route path="/toolbox/dtdle" element={<Dtdle />} />

        {/* Legacy redirects: preserve old bookmarked/shared links */}
        <Route
          path="/useful-links"
          element={<Navigate to="/toolbox/useful-links" replace />}
        />
        <Route path="/guides/*" element={<GuidesLegacyRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
