import { describe, expect, it } from 'vitest';
import { getContestOperatorAccessDecision } from '../../lib/contest-operator-access';

describe('contest operator access decisions', () => {
  it('sends logged-out users to auth', () => {
    expect(
      getContestOperatorAccessDecision({
        next: '/admin/contests',
        hasSupabaseConfig: true,
        roleSlugs: [],
        user: null,
      }),
    ).toEqual({
      allowed: false,
      reason: 'logged_out',
      redirectTo: '/auth?next=%2Fadmin%2Fcontests',
    });
  });

  it('blocks authenticated non-operators', () => {
    expect(
      getContestOperatorAccessDecision({
        next: '/admin/contests',
        hasSupabaseConfig: true,
        roleSlugs: [],
        user: {
          id: 'user-1',
          email: 'user@example.com',
          user_metadata: {
            username: 'user_1',
            display_name: 'user_1',
          },
        } as never,
      }),
    ).toEqual({
      allowed: false,
      reason: 'not_operator',
      redirectTo:
        '/profile?next=%2Fadmin%2Fcontests&status=error&message=Your+account+does+not+have+internal+contest+operator+access.',
    });
  });

  it('allows contest operators through', () => {
    expect(
      getContestOperatorAccessDecision({
        next: '/admin/contests',
        hasSupabaseConfig: true,
        roleSlugs: ['contest_operator'],
        user: {
          id: 'user-1',
          email: 'operator@example.com',
          user_metadata: {
            username: 'operator_1',
            display_name: 'operator_1',
          },
        } as never,
      }),
    ).toEqual({
      allowed: true,
      reason: 'allowed',
    });
  });
});
