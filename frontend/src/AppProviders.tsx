import type { ReactNode } from 'react';
import {
  BannerProvider,
  GradientThemeProvider,
  ResourcesProvider,
  SearchDataProvider,
  TierListReferenceProvider,
  UiOpacityProvider,
} from './contexts';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SearchDataProvider>
      <ResourcesProvider>
        <TierListReferenceProvider>
          <GradientThemeProvider>
            <UiOpacityProvider>
              <BannerProvider>{children}</BannerProvider>
            </UiOpacityProvider>
          </GradientThemeProvider>
        </TierListReferenceProvider>
      </ResourcesProvider>
    </SearchDataProvider>
  );
}
