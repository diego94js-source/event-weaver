import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, MapPin, Euro, Mail, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  event_date: string;
  deposit_amount: number;
  location: string | null;
  status: string;
}

interface Attendee {
  id: string;
  user_email: string;
  status: string;
  created_at: string;
}

interface EventDetailProps {
  event: Event;
  onBack: () => void;
}

export function EventDetail({ event, onBack }: EventDetailProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const publicUrl = `${window.location.origin}/event/${event.id}`;

  const fetchAttendees = async () => {
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los asistentes.',
        variant: 'destructive',
      });
    } else {
      setAttendees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendees();
  }, [event.id]);

  const handleToggleAttendance = async (attendee: Attendee) => {
    const newStatus = attendee.status === 'checked_in' ? 'registered' : 'checked_in';

    const { error } = await supabase
      .from('attendees')
      .update({ status: newStatus })
      .eq('id', attendee.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado.',
        variant: 'destructive',
      });
    } else {
      setAttendees((prev) =>
        prev.map((a) => (a.id === attendee.id ? { ...a, status: newStatus } : a))
      );
      toast({
        title: 'Estado actualizado',
        description: `${attendee.user_email} marcado como ${newStatus === 'checked_in' ? 'asistió' : 'registrado'}.`,
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: 'Link copiado',
      description: 'El enlace del evento ha sido copiado al portapapeles.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-green-600">Asistió</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No asistió</Badge>;
      default:
        return <Badge variant="secondary">Registrado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Detalles del Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(event.event_date), "EEEE, d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Euro className="h-4 w-4" />
              <span>Fianza: €{event.deposit_amount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Enlace de Invitación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Comparte este enlace para que tus invitados puedan registrarse:
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 justify-start gap-2 truncate" onClick={copyLink}>
                <Copy className="h-4 w-4 shrink-0" />
                <span className="truncate text-xs">{publicUrl}</span>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Asistentes ({attendees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando asistentes...</p>
          ) : attendees.length === 0 ? (
            <p className="text-muted-foreground">Aún no hay asistentes registrados.</p>
          ) : (
            <div className="space-y-3">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{attendee.user_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Registrado el {format(new Date(attendee.created_at), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(attendee.status)}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Asistió</span>
                      <Switch
                        checked={attendee.status === 'checked_in'}
                        onCheckedChange={() => handleToggleAttendance(attendee)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
