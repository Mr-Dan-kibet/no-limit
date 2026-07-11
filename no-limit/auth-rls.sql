-- ========================================
-- NO LIMIT — Row Level Security
-- Run this in the Supabase SQL editor AFTER creating your account
-- (npm run seed:user), and BEFORE merging the auth PR.
-- ========================================
--
-- Why this exists:
-- NEXT_PUBLIC_SUPABASE_ANON_KEY ships inside the browser bundle. It is public
-- by design. With RLS disabled, anyone who opens DevTools can lift that key and
-- read or delete every row in this database directly against the REST API —
-- the login page and middleware would not stop them.
--
-- No Limit is single-user, so the policy is deliberately simple:
--   authenticated  -> full access
--   anon           -> nothing
-- There is no public signup, so "any authenticated user" means "Dan".

do $$
declare
  t text;
begin
  foreach t in array array[
    'years',
    'goal_categories',
    'goals',
    'goal_milestones',
    'projects',
    'milestones',
    'events',
    'checklists',
    'checklist_completions',
    'time_categories',
    'timetable_slots',
    'time_blocks',
    'time_entries'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);

    execute format(
      'create policy %I on public.%I
         as permissive
         for all
         to authenticated
         using (true)
         with check (true)',
      t || '_authenticated_all', t
    );
  end loop;
end $$;

-- Verify: every table below should show rowsecurity = true and exactly one policy.
--
--   select c.relname,
--          c.relrowsecurity as rls_enabled,
--          count(p.polname)  as policies
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   left join pg_policy p on p.polrelid = c.oid
--   where n.nspname = 'public' and c.relkind = 'r'
--   group by 1, 2
--   order by 1;
