# Castan Visitas Realtime

## Antes de publicar
1. No Supabase, rode o arquivo `supabase-ajustes-realtime.sql` no SQL Editor.
2. No Supabase, habilite Realtime nas tabelas:
   - usuarios
   - visitas
   - notificacoes
   - acoes_visita

## Variáveis de ambiente na Vercel
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

## Deploy
- Framework: Vite
- Build command: npm run build
- Output directory: dist
