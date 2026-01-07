-- Crear enum para estados de eventos
CREATE TYPE public.event_status AS ENUM ('active', 'completed');

-- Crear enum para estados de asistentes
CREATE TYPE public.attendee_status AS ENUM ('registered', 'checked_in', 'no_show');

-- Tabla de eventos
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  location TEXT,
  status event_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de asistentes
CREATE TABLE public.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  status attendee_status NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver eventos (público con link)
CREATE POLICY "Anyone can view events"
ON public.events
FOR SELECT
USING (true);

-- Política: Solo el host puede insertar eventos
CREATE POLICY "Hosts can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

-- Política: Solo el host puede modificar sus eventos
CREATE POLICY "Hosts can update their events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

-- Política: Solo el host puede eliminar sus eventos
CREATE POLICY "Hosts can delete their events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = host_id);

-- Política: Cualquiera puede ver asistentes de un evento
CREATE POLICY "Anyone can view attendees"
ON public.attendees
FOR SELECT
USING (true);

-- Política: Cualquiera puede registrarse como asistente
CREATE POLICY "Anyone can register as attendee"
ON public.attendees
FOR INSERT
WITH CHECK (true);

-- Política: Solo el host del evento puede actualizar asistentes
CREATE POLICY "Hosts can update attendees"
ON public.attendees
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = attendees.event_id
    AND events.host_id = auth.uid()
  )
);

-- Política: Solo el host del evento puede eliminar asistentes
CREATE POLICY "Hosts can delete attendees"
ON public.attendees
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = attendees.event_id
    AND events.host_id = auth.uid()
  )
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at
BEFORE UPDATE ON public.attendees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();