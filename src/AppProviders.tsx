import type { ReactNode } from 'react';
import {
  BannerProvider,
  CharacterOwnershipProvider,
  GradientThemeProvider,
  LocaleProvider,
  ResourcesProvider,
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
                  {children}
                </CharacterOwnershipProvider>
              </BannerProvider>
            </UiOpacityProvider>
          </GradientThemeProvider>
        </TierListReferenceProvider>
      </ResourcesProvider>
    </LocaleProvider>
  );
}
