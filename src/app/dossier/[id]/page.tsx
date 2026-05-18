import { getDiscoveryById } from '@/app/actions/discovery';
import { notFound } from 'next/navigation';
import { DossierPageView } from '@/components/dossier/dossier-page-view';

interface DiscoveryData {
  id: string;
  name: string;
  category: string;
  explorationStatus: string;
  [key: string]: unknown;
}

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const discovery = await getDiscoveryById(resolvedParams.id);

  if (!discovery) {
    notFound();
  }

  return <DossierPageView initialDiscovery={discovery as DiscoveryData} />;
}
