import {
  DetailPageLoading,
  ListPageLoading,
} from '@/components/layout/PageLoadingSkeleton';
import { Container } from '@mantine/core';
import { isDetailRoute } from '@/constants/route-meta';
import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

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
const NotFound = lazy(() => import('@/pages/not-found/Page'));

function RouteFallback() {
  const { pathname } = useLocation();
  const isDetail = isDetailRoute(pathname);
  return isDetail ? (
    <Container size="xl" py="xl">
      <DetailPageLoading />
    </Container>
  ) : (
    <Container size="md" py="xl">
      <ListPageLoading cards={4} />
    </Container>
  );
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
          path="/howlkins/:allianceName"
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
        <Route path="/useful-links" element={<UsefulLinks />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/guides/faq" element={<FAQ />} />
        <Route path="/guides/beginner-qa" element={<BeginnerQA />} />
        <Route
          path="/guides/star-upgrade-calculator"
          element={<StarUpgradeCalculator />}
        />
        <Route
          path="/guides/mythic-summon-calculator"
          element={<MythicSummonCalculator />}
        />
        <Route
          path="/guides/diamond-calculator"
          element={<DiamondCalculator />}
        />
        <Route path="/guides/shovel-event" element={<ShovelEventGuide />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
