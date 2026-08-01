import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import EventsPageContent from '@/features/wiki/events/components/EventsPageContent';
import { useEventPortraits } from '@/features/wiki/events/hooks/use-event-portraits';
import { useEvents } from '@/features/wiki/hooks/use-wiki-data';

export default function Events() {
  const { data: events, loading, error, retry } = useEvents();
  const { data: characters } = useCharacters();
  const { portraitByReference, characterByIdentity } =
    useEventPortraits(characters);

  return (
    <EventsPageContent
      events={events}
      loading={loading}
      error={error}
      onRetry={retry}
      portraitByReference={portraitByReference}
      characterByIdentity={characterByIdentity}
    />
  );
}
