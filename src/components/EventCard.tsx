import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Euro } from 'lucide-react';
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

interface EventCardProps {
  event: Event;
  attendeeCount?: number;
  onClick: () => void;
}

export function EventCard({ event, attendeeCount = 0, onClick }: EventCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg bg-card border-border"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">
            {event.title}
          </CardTitle>
          <Badge
            variant={event.status === 'active' ? 'default' : 'secondary'}
            className="ml-2 shrink-0"
          >
            {event.status === 'active' ? 'Activo' : 'Completado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(event.event_date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{attendeeCount} registrados</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            <Euro className="h-4 w-4" />
            <span>{event.deposit_amount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
