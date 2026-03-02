import { HashRouter } from 'react-router-dom';
import RouteMeta from './components/common/RouteMeta';
import AppLayout from './components/layout/AppLayout';
import {
  ResourcesProvider,
  SearchDataProvider,
  TierListReferenceProvider,
} from './contexts';

export default function App() {
  return (
    <HashRouter>
      <RouteMeta />
      <SearchDataProvider>
        <ResourcesProvider>
          <TierListReferenceProvider>
            <AppLayout />
          </TierListReferenceProvider>
        </ResourcesProvider>
      </SearchDataProvider>
    </HashRouter>
  );
}
