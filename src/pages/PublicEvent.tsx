import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Loader2 } from "lucide-react";

// --- SUB-COMPONENTE: EL FORMULARIO (CheckoutForm) ---
// Al estar separado, garantizamos que Stripe no se desmonte al escribir
const CheckoutForm = ({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href + "?payment_success=true",
      },
      redirect: 'if_required',
    });
    if (error) {
      toast({ title: "Error en el pago", description: error.message, variant: "destructive" });
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="w-full bg-white p-4 rounded-lg min-h-[150px]">
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>
      <Button type="submit" disabled={!stripe || !elements || loading} className="w-full">
        {loading ? <Loader2 className="animate-spin" /> : "Reservar Lugar (€20.00)"}
      </Button>
    </form>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function PublicEvent() {
  const { id } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) console.error(error);
      setEvent(data);
      setLoading(false);
    };
    if (id) fetchEvent();
  }, [id]);

  const handleStartBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ title: "Faltan datos", description: "Por favor completa todos los campos", variant: "destructive" });
      return;
    }
    setIsPreparing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { eventId: id, email, name }
      });
      if (error || !data.clientSecret) throw new Error("Error obteniendo secreto");
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo iniciar el pago.", variant: "destructive" });
      setIsPreparing(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!event) return <div className="text-center p-8">Evento no encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{event.title}</CardTitle>
          <div className="text-slate-400 text-sm space-y-1">
            <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleDateString()}</p>
            {event.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.location}</p>}
          </div>
        </CardHeader>
        <CardContent>
          {!clientSecret ? (
            <form onSubmit={handleStartBooking} className="space-y-4">
              <div>
                <Label className="text-slate-300">Tu Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-700 border-slate-600 text-white" placeholder="Nombre" />
              </div>
              <div>
                <Label className="text-slate-300">Tu Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-700 border-slate-600 text-white" placeholder="Email" />
              </div>
              <Button type="submit" disabled={isPreparing} className="w-full">
                {isPreparing ? <Loader2 className="animate-spin" /> : "Continuar al Pago"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-green-400 text-center font-medium">Pago Iniciado Correctamente</p>
              <Elements 
                stripe={getStripePromise()} 
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0ea5e9',
                    }
                  }
                }}
              >
                <CheckoutForm
                  clientSecret={clientSecret}
                  onSuccess={() => toast({ title: "¡Éxito!", description: "Reserva confirmada" })}
                />
              </Elements>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
