import { HashRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import {
  ResourcesProvider,
  SearchDataProvider,
  SectionAccentProvider,
  TierListReferenceProvider,
} from './contexts';

export default function App() {
  return (
    <HashRouter>
      <SectionAccentProvider>
        <SearchDataProvider>
          <ResourcesProvider>
            <TierListReferenceProvider>
              <AppLayout />
            </TierListReferenceProvider>
          </ResourcesProvider>
        </SearchDataProvider>
      </SectionAccentProvider>
    </HashRouter>
  );
}
