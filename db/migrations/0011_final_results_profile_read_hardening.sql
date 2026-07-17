-- Replace the broad public profile read policy with a final-results-only policy.

do $$
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;

  drop policy if exists "public can read leaderboard profiles" on public.profiles;

  if to_regclass('public.contests') is not null
    and to_regclass('public.entry_scoring_results') is not null
  then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
        and policyname = 'public can read final results profiles'
    ) then
      create policy "public can read final results profiles"
      on public.profiles
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.entry_scoring_results
          join public.contests
            on contests.id = entry_scoring_results.contest_id
          where entry_scoring_results.user_id = profiles.id
            and contests.visibility_status = 'visible'
            and contests.status in ('final', 'paid_out')
        )
      );
    end if;
  end if;

  if to_regprocedure('public.is_contest_operator()') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
        and policyname = 'contest operators can read profiles for finalization'
    ) then
      create policy "contest operators can read profiles for finalization"
      on public.profiles
      for select
      to authenticated
      using (public.is_contest_operator());
    end if;
  end if;
end
$$;
