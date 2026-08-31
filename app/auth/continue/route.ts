import { NextRequest, NextResponse } from 'next/server';
import {
  buildAuthStatusHref,
  defaultReturnPath,
  getPostAuthDestination,
  normalizeReturnPath,
} from '@/lib/auth-profile';
import { getAppUrl, getRequestOrigin } from '@/lib/env';
import { getViewerIdentity } from '@/lib/viewer-identity';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request.headers, getAppUrl());
  const next = normalizeReturnPath(requestUrl.searchParams.get('next'), defaultReturnPath);
  const identity = await getViewerIdentity();

  if (!identity.isAuthenticated) {
    return NextResponse.redirect(
      new URL(
        buildAuthStatusHref(
          'auth',
          'error',
          next,
          'PickRank could not confirm your sign-in. Request a new sign-in link and try again.',
        ),
        requestOrigin,
      ),
    );
  }

  const destination = getPostAuthDestination(next, {
    isProfileComplete: identity.isProfileComplete,
    isEligibilityComplete: identity.eligibility.isEligibilityComplete,
  });

  return NextResponse.redirect(new URL(destination, requestOrigin));
}
