import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreateEventDialog } from './CreateEventDialog';
import { EventCard } from './EventCard';
import { EventDetail } from './EventDetail';
import { LogOut, Calendar } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  event_date: string;
  deposit_amount: number;
  location: string | null;
  status: string;
}

interface AttendeeCount {
  event_id: string;
  count: number;
}

export function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const fetchEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', user.id)
      .order('event_date', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos.',
        variant: 'destructive',
      });
    } else {
      setEvents(data || []);
      
      // Fetch attendee counts for each event
      if (data && data.length > 0) {
        const eventIds = data.map((e) => e.id);
        const { data: attendees } = await supabase
          .from('attendees')
          .select('event_id')
          .in('event_id', eventIds);

        if (attendees) {
          const counts: Record<string, number> = {};
          attendees.forEach((a) => {
            counts[a.event_id] = (counts[a.event_id] || 0) + 1;
          });
          setAttendeeCounts(counts);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente.',
    });
  };

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <EventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">NoFlake</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Mis Eventos</h2>
          <CreateEventDialog onEventCreated={fetchEvents} />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No tienes eventos</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Crea tu primer evento y comparte el enlace con tus invitados.
            </p>
            <CreateEventDialog onEventCreated={fetchEvents} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                attendeeCount={attendeeCounts[event.id] || 0}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
