-- Enable pg_cron and pg_net extensions for scheduled Edge Function invocation
-- pg_cron: enables scheduled jobs within PostgreSQL
-- pg_net: enables non-blocking HTTP requests from PostgreSQL
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule send-reminders Edge Function nightly at 20:00 JST (11:00 UTC)
-- The function queries assignments with status='confirmed' where match_date = tomorrow
-- and reminder_sent_at IS NULL, then sends LINE push messages.
--
-- Requires the following Supabase secrets to be configured:
--   SUPABASE_URL           — your project URL (e.g. https://<ref>.supabase.co)
--   SUPABASE_SERVICE_ROLE_KEY — service role key for the Authorization header
--
-- To set secrets: supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=<token>
select cron.schedule(
  'send-reminders-nightly',
  '0 11 * * *',
  $$
  select
    net.http_post(
      url      := current_setting('app.settings.supabase_url') || '/functions/v1/send-reminders',
      headers  := jsonb_build_object(
                    'Content-Type',  'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
                  ),
      body     := '{}'::jsonb
    ) as request_id;
  $$
);
