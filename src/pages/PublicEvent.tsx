import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Euro, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import StripePaymentForm from '@/components/StripePaymentForm';

interface Event {
  id: string;
  title: string;
  event_date: string;
  deposit_amount: number;
  location: string | null;
  status: string;
}

// Separate component to prevent re-renders of Elements
function StripeElementsWrapper({
  clientSecret,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  onSuccess: (intentId: string) => void;
  onError: (message: string) => void;
}) {
  const options = useMemo(
    () => ({
      clientSecret,
    }),
    [clientSecret]
  );

  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}

export default function PublicEvent() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({
          title: 'Error',
          description: 'No se pudo encontrar el evento.',
          variant: 'destructive',
        });
      } else {
        setEvent(data);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  const handleContinueToPayment = async () => {
    if (!event) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedName) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('attendees')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_email', trimmedEmail)
      .maybeSingle();

    if (existing) {
      toast({
        title: 'Ya registrado',
        description: 'Este email ya está registrado para el evento.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingIntent(true);

    // Create PaymentIntent via Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { eventId: event.id, email: trimmedEmail },
    });

    if (error || !data?.clientSecret) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el proceso de pago.',
        variant: 'destructive',
      });
      setCreatingIntent(false);
      return;
    }

    setClientSecret(data.clientSecret);
    setPaymentIntentId(data.paymentIntentId);
    setCreatingIntent(false);
  };

  const handlePaymentSuccess = async (intentId: string) => {
    if (!event) return;

    const trimmedEmail = email.trim().toLowerCase();

    // Save attendee with payment intent ID
    const { error } = await supabase.from('attendees').insert({
      event_id: event.id,
      user_email: trimmedEmail,
      stripe_payment_intent_id: intentId,
      status: 'registered',
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar el registro.',
        variant: 'destructive',
      });
    } else {
      setSubmitted(true);
      toast({
        title: '¡Registrado!',
        description: 'Te has registrado exitosamente para el evento.',
      });
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    toast({
      title: 'Error de pago',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Evento no encontrado</h1>
        <p className="mb-6 text-muted-foreground">El evento que buscas no existe o ha sido eliminado.</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">¡Registro Exitoso!</h1>
          <p className="mb-6 text-muted-foreground">
            Te has registrado para <strong>{event.title}</strong>.<br />
            Recibirás más información pronto.
          </p>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-400">
              Recuerda: Si no asistes, se te cobrará la fianza de €{event.deposit_amount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">{event.title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            Regístrate para confirmar tu asistencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <span>
                {format(new Date(event.event_date), "EEEE, d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{format(new Date(event.event_date), "HH:mm 'hrs'", { locale: es })}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-3 text-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg border-2 border-yellow-500 bg-yellow-500/10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Euro className="h-6 w-6" />
              <span className="text-2xl font-bold">€{event.deposit_amount.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-sm text-yellow-300">
              Fianza reembolsable si asistes
            </p>
          </div>

          {!clientSecret ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Tu Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Tu Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="bg-input border-border"
                />
              </div>
              <Button 
                onClick={handleContinueToPayment} 
                className="w-full text-lg py-6" 
                disabled={creatingIntent}
              >
                {creatingIntent && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Continuar al Pago
              </Button>
            </div>
          ) : (
            <div className="border-2 border-red-500 min-h-[300px] p-4">
              <p className="text-white mb-4">Secret: {clientSecret?.slice(0, 20)}...</p>
              <StripeElementsWrapper
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
