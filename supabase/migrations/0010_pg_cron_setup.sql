-- ─────────────────────────────────────────────────────────────────────────────
-- 0010_pg_cron_setup.sql
-- Schedules the task-reminders Edge Function every 5 minutes via pg_cron.
--
-- PREREQUISITES (run once in Supabase Dashboard → Database → Extensions):
--   enable pg_cron
--   enable pg_net
--
-- BEFORE RUNNING THIS MIGRATION replace the two placeholders below:
--   <YOUR_PROJECT_REF>  → your Supabase project reference (e.g. abcdefghijkl)
--   <YOUR_SERVICE_ROLE_KEY> → Settings → API → service_role secret
-- ─────────────────────────────────────────────────────────────────────────────

select cron.schedule(
  'task-reminders',           -- job name (must be unique)
  '*/5 * * * *',              -- every 5 minutes https://.supabase.co
  $cron$
    select net.http_post(
      url     := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/task-reminders',
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
                 ),
      body    := '{}'::jsonb
    );
  $cron$
);
