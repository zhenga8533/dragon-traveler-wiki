import { BrowserRouter } from 'react-router-dom';
import RouteMeta from './components/common/RouteMeta';
import AppLayout from './components/layout/AppLayout';
import {
  BannerProvider,
  ResourcesProvider,
  SearchDataProvider,
  TierListReferenceProvider,
} from './contexts';

export default function App() {
  return (
    <BrowserRouter>
      <RouteMeta />
      <SearchDataProvider>
        <ResourcesProvider>
          <TierListReferenceProvider>
            <BannerProvider>
              <AppLayout />
            </BannerProvider>
          </TierListReferenceProvider>
        </ResourcesProvider>
      </SearchDataProvider>
    </BrowserRouter>
  );
}
