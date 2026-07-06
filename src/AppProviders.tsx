import type { ReactNode } from 'react';
import {
  BannerProvider,
  CharacterOwnershipProvider,
  FavoriteIllustrationsProvider,
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
              <FavoriteIllustrationsProvider>
                <BannerProvider>
                  <CharacterOwnershipProvider>
                    <SearchDataProvider>
                      {children}
                    </SearchDataProvider>
                  </CharacterOwnershipProvider>
                </BannerProvider>
              </FavoriteIllustrationsProvider>
            </UiOpacityProvider>
          </GradientThemeProvider>
        </TierListReferenceProvider>
      </ResourcesProvider>
    </LocaleProvider>
  );
}
