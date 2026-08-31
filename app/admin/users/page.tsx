import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, UserRound } from 'lucide-react';
import { AdminDataFreshness } from '@/components/admin/admin-data-freshness';
import { Button } from '@/components/ui/button';
import { listAdminEvidenceUsers, recordAdminAuditEvent, type AdminEvidenceUser } from '@/lib/admin-evidence';
import { requireContestOperator } from '@/lib/contest-operator-access';

const PAGE_SIZE = 25;

type UserDirectoryParams = {
  account?: string;
  eligibility?: string;
  evidence?: string;
  page?: string;
  q?: string;
  sort?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<UserDirectoryParams>;
}) {
  const access = await requireContestOperator('/admin/users');
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() || '';
  const accountFilter = params.account || 'all';
  const eligibilityFilter = params.eligibility || 'all';
  const evidenceFilter = params.evidence || 'all';
  const sort = params.sort || 'recent';
  const allUsers = await listAdminEvidenceUsers();
  const accountStatuses = uniqueStatuses(allUsers.map((user) => user.accountStatus));
  const eligibilityStatuses = uniqueStatuses(allUsers.map((user) => user.eligibilityStatus));
  const filteredUsers = allUsers
    .filter((user) => matchesQuery(user, query))
    .filter((user) => accountFilter === 'all' || user.accountStatus === accountFilter)
    .filter((user) => eligibilityFilter === 'all' || user.eligibilityStatus === eligibilityFilter)
    .filter((user) => matchesEvidenceFilter(user, evidenceFilter))
    .sort(userSorter(sort));
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(params.page || '1', 10);
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const users = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);
  const hasFilters = Boolean(query) || accountFilter !== 'all' || eligibilityFilter !== 'all'
    || evidenceFilter !== 'all' || sort !== 'recent';

  if (query && (query.includes('@') || /^[0-9a-f-]{32,36}$/i.test(query))) {
    await recordAdminAuditEvent({
      actorUserId: access.user?.id || null,
      eventType: 'sensitive_user_search',
      metadata: { query_type: query.includes('@') ? 'email' : 'user_id' },
      targetType: 'user_search',
    });
  }

  const loadedAt = new Date().toISOString();

  return (
    <div className="space-y-6 pb-24">
      <section className="screen-header space-y-2">
        <p className="eyebrow">Internal admin</p>
        <h1 className="text-3xl font-black leading-tight">User data</h1>
        <p className="text-muted-foreground">
          Review every user, then follow an account through contests, saved board versions, and final results.
        </p>
        <AdminDataFreshness loadedAt={loadedAt} />
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm" aria-labelledby="user-directory-heading">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">User directory</p>
            <h2 id="user-directory-heading" className="mt-1 text-xl font-black text-slate-950">All users</h2>
          </div>
          <p className="text-sm text-slate-600">{allUsers.length} total {allUsers.length === 1 ? 'user' : 'users'}</p>
        </div>

        <form
          className="mt-4 grid gap-3 md:grid-cols-2 md:items-end xl:grid-cols-3 2xl:grid-cols-[minmax(14rem,2fr)_repeat(4,minmax(8rem,1fr))_auto]"
          action="/admin/users"
        >
          <DirectoryField label="Search" htmlFor="admin-user-search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="admin-user-search"
                name="q"
                defaultValue={query}
                placeholder="Name, email, or user ID"
                className="min-h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm outline-none ring-primary/20 focus:ring-4"
              />
            </div>
          </DirectoryField>
          <DirectoryField label="Account" htmlFor="admin-user-account">
            <select id="admin-user-account" name="account" defaultValue={accountFilter} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="all">All statuses</option>
              {accountStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
          </DirectoryField>
          <DirectoryField label="Eligibility" htmlFor="admin-user-eligibility">
            <select id="admin-user-eligibility" name="eligibility" defaultValue={eligibilityFilter} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="all">All statuses</option>
              {eligibilityStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
          </DirectoryField>
          <DirectoryField label="Evidence" htmlFor="admin-user-evidence">
            <select id="admin-user-evidence" name="evidence" defaultValue={evidenceFilter} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="all">All evidence</option>
              <option value="complete">Complete</option>
              <option value="missing">Needs attention</option>
              <option value="no_entries">No entries</option>
            </select>
          </DirectoryField>
          <DirectoryField label="Sort" htmlFor="admin-user-sort">
            <select id="admin-user-sort" name="sort" defaultValue={sort} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm">
              <option value="recent">Recently active</option>
              <option value="created">Newest accounts</option>
              <option value="name">Name A–Z</option>
              <option value="entries">Most entries</option>
            </select>
          </DirectoryField>
          <Button type="submit" className="w-full">Apply</Button>
        </form>

        {hasFilters ? (
          <Link href="/admin/users" className="mt-3 inline-flex text-sm font-bold text-primary hover:underline">Clear filters</Link>
        ) : null}
      </section>

      <div className="flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>{resultSummary(pageStart, users.length, filteredUsers.length)}</p>
        <p>Page {currentPage} of {pageCount}</p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <UserRound className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-bold text-slate-950">No matching users</p>
            <p className="mt-1 text-sm text-slate-500">Clear a filter or try a different search.</p>
          </div>
        ) : (
          <div className="divide-y">
            {users.map((user) => (
              <article key={user.userId} className="grid gap-4 p-4 xl:grid-cols-[minmax(15rem,1.4fr)_minmax(11rem,0.8fr)_minmax(10rem,0.7fr)_minmax(15rem,1fr)] xl:items-center">
                <div className="min-w-0">
                  <Link href={`/admin/users/${user.userId}`} className="font-extrabold text-primary hover:underline">
                    {user.displayName}
                  </Link>
                  <p className="mt-1 truncate text-sm text-slate-600">@{user.username} · {user.email}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{user.userId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={formatStatus(user.accountStatus)} />
                  <StatusPill label={formatStatus(user.eligibilityStatus)} muted />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Last active</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(user.lastSignInAt || user.createdAt)}</p>
                </div>
                <dl className="grid grid-cols-4 gap-3 text-center text-xs">
                  <UserCount label="Entries" value={user.entryCount} />
                  <UserCount label="Revisions" value={user.revisionCount} />
                  <UserCount label="Scored" value={user.scoredEntryCount} />
                  <div>
                    <dt className="text-slate-500">Evidence</dt>
                    <dd className={`mt-2 text-xs font-black ${evidenceState(user) === 'Complete' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {evidenceState(user)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>

      {pageCount > 1 ? (
        <nav className="flex items-center justify-between" aria-label="User directory pages">
          {currentPage > 1 ? (
            <Link href={pageHref(params, currentPage - 1)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </Link>
          ) : <span />}
          {currentPage < pageCount ? (
            <Link href={pageHref(params, currentPage + 1)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50">
              Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function DirectoryField({ children, htmlFor, label }: { children: React.ReactNode; htmlFor: string; label: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ label, muted = false }: { label: string; muted?: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${muted ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-800'}`}>{label}</span>;
}

function UserCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="numeric mt-1 text-lg font-black text-slate-950">{value}</dd>
    </div>
  );
}

function uniqueStatuses(statuses: string[]) {
  return [...new Set(statuses)].sort((left, right) => left.localeCompare(right));
}

function evidenceState(user: AdminEvidenceUser) {
  if (user.entryCount === 0) return 'No entries';
  return user.entries.every((entry) => entry.revisions.length > 0) ? 'Complete' : 'Needs attention';
}

function matchesEvidenceFilter(user: AdminEvidenceUser, filter: string) {
  if (filter === 'complete') return evidenceState(user) === 'Complete';
  if (filter === 'missing') return evidenceState(user) === 'Needs attention';
  if (filter === 'no_entries') return evidenceState(user) === 'No entries';
  return true;
}

function matchesQuery(user: AdminEvidenceUser, query: string) {
  const normalizedQuery = query.toLowerCase();
  if (!normalizedQuery) return true;
  return [user.email, user.username, user.displayName, user.userId]
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

function userSorter(sort: string) {
  return (left: AdminEvidenceUser, right: AdminEvidenceUser) => {
    if (sort === 'created') return right.createdAt.localeCompare(left.createdAt);
    if (sort === 'name') return left.displayName.localeCompare(right.displayName);
    if (sort === 'entries') return right.entryCount - left.entryCount || left.displayName.localeCompare(right.displayName);
    return (right.lastSignInAt || right.createdAt).localeCompare(left.lastSignInAt || left.createdAt);
  };
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
}

function resultSummary(start: number, count: number, total: number) {
  if (total === 0) return 'Showing 0 users';
  return `Showing ${start + 1}–${start + count} of ${total} ${total === 1 ? 'user' : 'users'}`;
}

function pageHref(params: UserDirectoryParams, page: number) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== 'page') next.set(key, value);
  }
  next.set('page', String(page));
  return `/admin/users?${next.toString()}`;
}
