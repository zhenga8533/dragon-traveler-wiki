import { Center, Loader } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const Home = lazy(() => import('../pages/home'));
const Artifacts = lazy(() => import('../pages/Artifacts'));
const ArtifactPage = lazy(() => import('../pages/ArtifactPage'));
const Characters = lazy(() => import('../pages/Characters'));
const CharacterPage = lazy(() => import('../pages/character'));
const GearPage = lazy(() => import('../pages/Gear'));
const GearSetPage = lazy(() => import('../pages/GearSetPage'));
const Howlkins = lazy(() => import('../pages/Howlkins'));
const NoblePhantasms = lazy(() => import('../pages/NoblePhantasms'));
const NoblePhantasmPage = lazy(() => import('../pages/NoblePhantasmPage'));
const Resources = lazy(() => import('../pages/Resources'));
const Subclasses = lazy(() => import('../pages/Subclasses'));
const StatusEffects = lazy(() => import('../pages/StatusEffects'));
const DragonSpells = lazy(() => import('../pages/Wyrmspells'));
const TierList = lazy(() => import('../pages/TierList'));
const Teams = lazy(() => import('../pages/Teams'));
const TeamPage = lazy(() => import('../pages/TeamPage'));
const Codes = lazy(() => import('../pages/Codes'));
const UsefulLinks = lazy(() => import('../pages/UsefulLinks'));
const Changelog = lazy(() => import('../pages/Changelog'));
const BeginnerQA = lazy(() => import('../pages/BeginnerQA'));
const StarUpgradeCalculator = lazy(
  () => import('../pages/StarUpgradeCalculator')
);
const MythicSummonCalculator = lazy(
  () => import('../pages/MythicSummonCalculator')
);
const ShovelEventGuide = lazy(() => import('../pages/ShovelEventGuide'));
const NotFound = lazy(() => import('../pages/NotFound'));

function RouteFallback() {
  return (
    <Center mih="40vh">
      <Loader size="md" />
    </Center>
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
        <Route path="/teams/:teamName" element={<TeamPage />} />
        <Route path="/codes" element={<Codes />} />
        <Route path="/useful-links" element={<UsefulLinks />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/guides/beginner-qa" element={<BeginnerQA />} />
        <Route
          path="/guides/star-upgrade-calculator"
          element={<StarUpgradeCalculator />}
        />
        <Route
          path="/guides/mythic-summon-calculator"
          element={<MythicSummonCalculator />}
        />
        <Route path="/guides/shovel-event" element={<ShovelEventGuide />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
