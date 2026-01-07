import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2 } from 'lucide-react';

interface CreateEventDialogProps {
  onEventCreated: () => void;
}

export function CreateEventDialog({ onEventCreated }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [location, setLocation] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase.from('events').insert({
      host_id: user.id,
      title: title.trim(),
      event_date: new Date(eventDate).toISOString(),
      deposit_amount: parseFloat(depositAmount) || 0,
      location: location.trim() || null,
    });

    if (error) {
      toast({
        title: 'Error al crear evento',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Evento creado',
        description: 'Tu evento ha sido creado exitosamente.',
      });
      setOpen(false);
      setTitle('');
      setEventDate('');
      setDepositAmount('');
      setLocation('');
      onEventCreated();
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Crear Nuevo Evento</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Completa los detalles de tu evento. Los invitados podrán registrarse con su email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">Título del Evento</Label>
            <Input
              id="title"
              placeholder="Ej: Cena de cumpleaños"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">Fecha y Hora</Label>
            <Input
              id="date"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit" className="text-foreground">Monto de Fianza (€)</Label>
            <Input
              id="deposit"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">Ubicación</Label>
            <Input
              id="location"
              placeholder="Ej: Restaurante XYZ, Madrid"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
              className="bg-input border-border"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Evento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
