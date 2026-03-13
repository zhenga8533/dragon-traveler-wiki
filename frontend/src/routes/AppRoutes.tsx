import {
  DetailPageLoading,
  ListPageLoading,
} from '@/components/layout/PageLoadingSkeleton';
import { Container } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

const Home = lazy(() => import('@/pages/home'));
const Artifacts = lazy(() => import('@/pages/artifacts/ListPage'));
const ArtifactPage = lazy(() => import('@/pages/artifacts/DetailPage'));
const Characters = lazy(() => import('@/pages/characters'));
const CharacterPage = lazy(() => import('@/pages/character'));
const GearPage = lazy(() => import('@/pages/gear/ListPage'));
const GearSetPage = lazy(() => import('@/pages/gear/DetailPage'));
const Howlkins = lazy(() => import('@/pages/howlkins'));
const NoblePhantasms = lazy(() => import('@/pages/noble-phantasms/ListPage'));
const NoblePhantasmPage = lazy(
  () => import('@/pages/noble-phantasms/DetailPage')
);
const Resources = lazy(() => import('@/pages/resources'));
const Subclasses = lazy(() => import('@/pages/subclasses'));
const StatusEffects = lazy(() => import('@/pages/status-effects'));
const DragonSpells = lazy(() => import('@/pages/wyrmspells'));
const TierList = lazy(() => import('@/pages/tier-list'));
const Teams = lazy(() => import('@/pages/teams'));
const TeamPage = lazy(() => import('@/pages/team'));
const SavedTeamPage = lazy(() => import('@/pages/team/SavedTeamPage'));
const Codes = lazy(() => import('@/pages/codes'));
const Events = lazy(() => import('@/pages/events'));
const UsefulLinks = lazy(() => import('@/pages/useful-links'));
const Changelog = lazy(() => import('@/pages/changelog'));
const BeginnerQA = lazy(() => import('@/pages/guides/BeginnerQA'));
const FAQ = lazy(() => import('@/pages/faq'));
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
const NotFound = lazy(() => import('@/pages/not-found'));

const DETAIL_ROUTE_RE =
  /^\/(?:artifacts|characters|noble-phantasms|gear-sets|teams(?:\/saved)?)(\/[^/]+)+$/;

function RouteFallback() {
  const { pathname } = useLocation();
  const isDetail = DETAIL_ROUTE_RE.test(pathname);
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
        <Route path="/howlkins" element={<Howlkins />} />
        <Route path="/noble-phantasms" element={<NoblePhantasms />} />
        <Route path="/noble-phantasms/:name" element={<NoblePhantasmPage />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/subclasses" element={<Subclasses />} />
        <Route path="/status-effects" element={<StatusEffects />} />
        <Route path="/wyrmspells" element={<DragonSpells />} />
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
