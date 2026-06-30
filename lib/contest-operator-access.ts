import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { buildAuthHref, buildProfileHref, getProfileIdentity } from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const contestOperatorRoleSlug = 'contest_operator';

type ContestOperatorAccessState = {
  next: string;
  hasSupabaseConfig: boolean;
  roleSlugs: string[];
  user: User | null;
};

type ContestOperatorAccessDecision =
  | { allowed: true; reason: 'allowed' }
  | { allowed: false; redirectTo: string; reason: 'missing_config' | 'logged_out' | 'profile_incomplete' | 'not_operator' };

export function getContestOperatorAccessDecision({
  next,
  hasSupabaseConfig,
  roleSlugs,
  user,
}: ContestOperatorAccessState): ContestOperatorAccessDecision {
  if (!hasSupabaseConfig) {
    return {
      allowed: false,
      reason: 'missing_config',
      redirectTo: buildAuthHref(next),
    };
  }

  if (!user) {
    return {
      allowed: false,
      reason: 'logged_out',
      redirectTo: buildAuthHref(next),
    };
  }

  const identity = getProfileIdentity(user);

  if (!identity.isProfileComplete) {
    return {
      allowed: false,
      reason: 'profile_incomplete',
      redirectTo: buildProfileHref(next),
    };
  }

  if (!roleSlugs.includes(contestOperatorRoleSlug)) {
    return {
      allowed: false,
      reason: 'not_operator',
      redirectTo: buildOperatorDeniedHref(next),
    };
  }

  return {
    allowed: true,
    reason: 'allowed',
  };
}

export async function getCurrentOperatorRoles() {
  if (!hasBrowserSupabaseConfig()) {
    return {
      user: null,
      roleSlugs: [] as string[],
      isContestOperator: false,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        user: null,
        roleSlugs: [] as string[],
        isContestOperator: false,
      };
    }

    const userRolesQuery = supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id) as unknown as Promise<{ data: Array<{ role_id: string }> | null }>;
    const { data: userRoleRows } = await userRolesQuery;

    const roleIds = (userRoleRows || []).map((row) => row.role_id);
    const { data: roleRows } = roleIds.length
      ? await supabase.from('roles').select('slug').in('id', roleIds)
      : { data: [] as Array<{ slug: string }> };

    const roleSlugs = (roleRows || []).map((row) => row.slug).filter((slug): slug is string => typeof slug === 'string');

    return {
      user,
      roleSlugs,
      isContestOperator: roleSlugs.includes(contestOperatorRoleSlug),
    };
  } catch {
    return {
      user: null,
      roleSlugs: [] as string[],
      isContestOperator: false,
    };
  }
}

export async function requireContestOperator(next = '/admin/contests') {
  const authState = await getCurrentOperatorRoles();
  const decision = getContestOperatorAccessDecision({
    next,
    hasSupabaseConfig: hasBrowserSupabaseConfig(),
    roleSlugs: authState.roleSlugs,
    user: authState.user,
  });

  if (!decision.allowed) {
    redirect(decision.redirectTo);
  }

  return authState;
}

function buildOperatorDeniedHref(next: string) {
  const params = new URLSearchParams({
    next,
    status: 'error',
    message: 'Your account does not have internal contest operator access.',
  });

  return `/profile?${params.toString()}`;
}
