-- Tareas recurrentes de los lunes — 4 meses (2026-05-11 → 2026-09-11)
-- Ejecutar en Supabase → SQL Editor
-- ⚠️ Repostería usa points = 1 (mínimo) porque el schema exige points > 0

WITH
  fam AS (
    SELECT id FROM public.families LIMIT 1
  ),
  child_profile AS (
    SELECT id FROM public.profiles
    WHERE family_id = (SELECT id FROM fam) AND role = 'child'
    LIMIT 1
  ),
  parent_profile AS (
    SELECT id FROM public.profiles
    WHERE family_id = (SELECT id FROM fam) AND role = 'parent'
    LIMIT 1
  )
INSERT INTO public.tasks
  (family_id, assigned_to, created_by, title, description, points, emoji,
   recurrence_type, recurrence_days, due_time, start_date, end_date, requires_approval, active)
SELECT
  fam.id,
  child_profile.id,
  parent_profile.id,
  t.title,
  t.description,
  t.points,
  t.emoji,
  'weekly',
  ARRAY[1],          -- 1 = lunes (0=Dom … 6=Sáb)
  t.due_time::time,
  '2026-05-11'::date,
  '2026-09-11'::date,
  t.requires_approval,
  true
FROM fam, child_profile, parent_profile,
  (VALUES
    ('Inicio (Levantarse, ducha, vestirse)', 'Límite: 8:30 am', 5,  '☀️', '07:30', false),
    ('Limpiar arenero de Nix',              'Límite: 12:00',   2,  '🐱', '09:00', true),
    ('Repostería (sesión 2 h)',             NULL,              1,  '🧁', '14:30', false),
    ('Pasear a Lupe',                       NULL,              5,  '🐕', '16:30', true),
    ('Aseo en casa (30–45 min)',            NULL,              4,  '🧹', '17:30', true),
    ('Nix tarde',                           NULL,              2,  '🌙', NULL,    true)
  ) AS t(title, description, points, emoji, due_time, requires_approval);
