-- Castan Visitas — habilitar sincronização Realtime
-- Execute uma vez no Supabase > SQL Editor.
-- Seguro para reexecução: só adiciona tabelas ainda ausentes da publicação.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usuarios',
    'visitas',
    'notificacoes',
    'acoes_visita',
    'fotos_visita',
    'agenda_bloqueios'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
