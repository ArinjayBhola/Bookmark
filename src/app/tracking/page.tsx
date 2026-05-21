import { ExplorationStats } from '@/components/tracking/exploration-stats';
import { getDiscoveriesPage, getExplorationStats } from '@/app/actions/discovery';

const PAGE_SIZE = 10;

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page || '1') || 1);
  const search = resolvedSearchParams.search?.trim() || '';
  const [stats, discoveriesPage] = await Promise.all([
    getExplorationStats(),
    getDiscoveriesPage({ page, pageSize: PAGE_SIZE, search }),
  ]);

  return <ExplorationStats key={`${search}-${discoveriesPage.page}`} stats={stats} discoveriesPage={discoveriesPage} search={search} />;
}
