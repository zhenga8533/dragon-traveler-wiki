import { BrowserRouter } from 'react-router-dom';
import RouteMeta from './components/common/RouteMeta';
import AppLayout from './components/layout/AppLayout';
import {
  BannerProvider,
  GradientThemeProvider,
  ResourcesProvider,
  SearchDataProvider,
  TierListReferenceProvider,
  UiOpacityProvider,
} from './contexts';

export default function App() {
  return (
    <BrowserRouter>
      <RouteMeta />
      <SearchDataProvider>
        <ResourcesProvider>
          <TierListReferenceProvider>
            <GradientThemeProvider>
              <UiOpacityProvider>
                <BannerProvider>
                  <AppLayout />
                </BannerProvider>
              </UiOpacityProvider>
            </GradientThemeProvider>
          </TierListReferenceProvider>
        </ResourcesProvider>
      </SearchDataProvider>
    </BrowserRouter>
  );
}
