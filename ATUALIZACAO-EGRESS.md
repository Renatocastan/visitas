# Correção de Egress — Castan Visitas

## O que foi corrigido
- removido polling global de `loadAll()` a cada 3 segundos;
- removido polling extra da tela Central a cada 15 segundos;
- mantida sincronização automática via Supabase Realtime;
- eventos em rajada são agrupados por 500 ms antes de uma única sincronização;
- ao voltar para a aba/app há fallback de sincronização, limitado a uma vez por 60 s;
- o verificador de nova versão a cada 60 s foi mantido: ele consulta a hospedagem do app, não o Supabase;
- o alerta local de visita a cada 30 s foi mantido: ele usa os dados já em memória e não consulta o Supabase.

## Antes do deploy
Execute `supabase-ajustes-realtime.sql` no SQL Editor do Supabase.

## Validação
1. Faça deploy.
2. Abra Logs > Live no Supabase.
3. Abra a Agenda em dois dispositivos/usuários.
4. Crie ou altere uma visita em um deles.
5. Confirme atualização automática no outro.
6. Confirme que não há mais rajadas periódicas a cada 3 s/15 s.
