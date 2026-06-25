import type { ReactNode } from 'react';
import {
  BannerProvider,
  CharacterOwnershipProvider,
  GradientThemeProvider,
  LocaleProvider,
  ResourcesProvider,
  SearchDataProvider,
  TierListReferenceProvider,
  UiOpacityProvider,
} from './contexts';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ResourcesProvider>
        <TierListReferenceProvider>
          <GradientThemeProvider>
            <UiOpacityProvider>
              <BannerProvider>
                <CharacterOwnershipProvider>
                  <SearchDataProvider>
                    {children}
                  </SearchDataProvider>
                </CharacterOwnershipProvider>
              </BannerProvider>
            </UiOpacityProvider>
          </GradientThemeProvider>
        </TierListReferenceProvider>
      </ResourcesProvider>
    </LocaleProvider>
  );
}
