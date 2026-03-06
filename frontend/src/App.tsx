import { BrowserRouter } from 'react-router-dom';
import RouteMeta from './components/common/RouteMeta';
import AppLayout from './components/layout/AppLayout';
import {
  BannerProvider,
  GradientThemeProvider,
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
            <GradientThemeProvider>
              <BannerProvider>
                <AppLayout />
              </BannerProvider>
            </GradientThemeProvider>
          </TierListReferenceProvider>
        </ResourcesProvider>
      </SearchDataProvider>
    </BrowserRouter>
  );
}
