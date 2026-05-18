'use server';

import { db } from '@/db';
import { discoveries, media, journalEntries } from '@/db/schema';
import { TerrainCategory, ExplorationStatus, Difficulty, FileType } from '@/db/enums';
import { eq, and, or, ilike, gte, lte, desc } from 'drizzle-orm';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';

export interface GetDiscoveriesParams {
  category?: TerrainCategory | 'ALL';
  status?: ExplorationStatus | 'ALL';
  region?: string;
  search?: string;
  bounds?: { _sw: { lat: number; lng: number }; _ne: { lat: number; lng: number } };
}

const getDiscoveriesCached = unstable_cache(
  async (category: string, status: string, region: string, search: string, boundsStr: string) => {
    const conditions = [];

    if (category && category !== 'ALL') {
      conditions.push(eq(discoveries.category, category as TerrainCategory));
    }

    if (status && status !== 'ALL') {
      conditions.push(eq(discoveries.explorationStatus, status as ExplorationStatus));
    }

    if (region && region !== 'ALL') {
      conditions.push(eq(discoveries.region, region));
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(discoveries.name, searchTerm),
          ilike(discoveries.localName, searchTerm),
          ilike(discoveries.region, searchTerm),
          ilike(discoveries.routeNotes, searchTerm),
          ilike(discoveries.whySaved, searchTerm)
        )
      );
    }

    if (boundsStr !== 'NONE') {
      const bounds = JSON.parse(boundsStr);
      conditions.push(
        and(
          gte(discoveries.latitude, bounds._sw.lat),
          lte(discoveries.latitude, bounds._ne.lat),
          gte(discoveries.longitude, bounds._sw.lng),
          lte(discoveries.longitude, bounds._ne.lng)
        )
      );
    }

    const results = await db.query.discoveries.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        media: true,
      },
      orderBy: [desc(discoveries.createdAt)],
    });

    return results;
  },
  ['discoveries-list-cache'],
  { tags: ['discoveries'], revalidate: 3600 }
);

export async function getDiscoveries(params: GetDiscoveriesParams = {}) {
  const { category = 'ALL', status = 'ALL', region = 'ALL', search = '', bounds } = params;
  const boundsStr = bounds ? JSON.stringify(bounds) : 'NONE';

  return await getDiscoveriesCached(category, status, region, search, boundsStr);
}

export async function getDiscoveryById(id: string) {
  if (!id) return null;
  const getCached = unstable_cache(
    async () => {
      const discovery = await db.query.discoveries.findFirst({
        where: eq(discoveries.id, id),
        with: {
          media: true,
          journalEntries: {
            orderBy: [desc(journalEntries.date)],
          },
        },
      });

      if (!discovery) return null;
      return discovery;
    },
    [`discovery-detail-${id}`],
    { tags: ['discoveries', `discovery-detail-${id}`], revalidate: 3600 }
  );

  return await getCached();
}

export async function createDiscovery(data: {
  name: string;
  localName?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  region?: string;
  state: string;
  country?: string;
  category: TerrainCategory;
  routeNotes?: string;
  difficulty?: Difficulty;
  technicality?: string;
  bestSeason?: string;
  waterSources?: string;
  campsites?: string;
  permits?: string;
  riskNotes?: string;
  acclimatization?: string;
  altitudeGain?: number;
  crowdLevel?: string;
  remotenessScore?: number;
  whySaved?: string;
  expeditionDreams?: string;
  futureIdeas?: string;
  emotionalNotes?: string;
  comparisons?: string;
  explorationStatus?: ExplorationStatus;
  externalLinks?: string[];
  customInfo?: unknown;
  media?: { name: string; fileType: FileType; url: string; key: string; size: number; mimeType: string }[];
}) {
  const { media: mediaItems, ...fields } = data;

  const [discovery] = await db.insert(discoveries).values({
    ...fields,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  if (mediaItems && mediaItems.length > 0) {
    await db.insert(media).values(
      mediaItems.map((m) => ({
        ...m,
        discoveryId: discovery.id,
      }))
    );
  }

  const createdDiscovery = await getDiscoveryById(discovery.id);

  revalidateTag('discoveries', { expire: 0 });
  revalidateTag('exploration-stats', { expire: 0 });
  revalidatePath('/');
  revalidatePath('/tracking');
  return createdDiscovery;
}

export async function updateDiscovery(
  id: string,
  data: Partial<{
    name: string;
    localName?: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    region?: string;
    state?: string;
    country?: string;
    category: TerrainCategory;
    routeNotes?: string;
    difficulty?: Difficulty;
    technicality?: string;
    bestSeason?: string;
    waterSources?: string;
    campsites?: string;
    permits?: string;
    riskNotes?: string;
    acclimatization?: string;
    altitudeGain?: number;
    crowdLevel?: string;
    remotenessScore?: number;
    whySaved?: string;
    expeditionDreams?: string;
    futureIdeas?: string;
    emotionalNotes?: string;
    comparisons?: string;
    explorationStatus?: ExplorationStatus;
    externalLinks?: string[];
    customInfo?: unknown;
  }>
) {
  await db.update(discoveries).set({ ...data, updatedAt: new Date() }).where(eq(discoveries.id, id));

  revalidateTag('discoveries', { expire: 0 });
  revalidateTag('discovery-detail', { expire: 0 });
  revalidateTag('exploration-stats', { expire: 0 });
  revalidatePath('/');
  revalidatePath(`/dossier/${id}`);
  revalidatePath('/tracking');

  const updatedDiscovery = await getDiscoveryById(id);
  return updatedDiscovery;
}

export async function deleteDiscovery(id: string) {
  await db.delete(discoveries).where(eq(discoveries.id, id));

  revalidateTag('discoveries', { expire: 0 });
  revalidateTag('discovery-detail', { expire: 0 });
  revalidateTag('exploration-stats', { expire: 0 });
  revalidatePath('/');
  revalidatePath('/tracking');
  return true;
}

const getExplorationStatsCached = unstable_cache(
  async () => {
    const allDiscoveries = await db.query.discoveries.findMany({
      columns: {
        explorationStatus: true,
        region: true,
        altitudeGain: true,
        elevation: true,
        category: true,
      },
    });

    const statusCounts: Record<ExplorationStatus, number> = {
      VISITED: 0,
      RESEARCHING: 0,
      PLANNED: 0,
      DREAM_EXPEDITION: 0,
      COMPLETED: 0,
      ABANDONED: 0,
    };

    const regionCounts: Record<string, number> = {};
    let totalAltitudeGain = 0;
    let highestElevation = 0;

    allDiscoveries.forEach((d) => {
      if (d.explorationStatus) {
        statusCounts[d.explorationStatus] = (statusCounts[d.explorationStatus] || 0) + 1;
      }
      if (d.region) {
        regionCounts[d.region] = (regionCounts[d.region] || 0) + 1;
      }
      if (d.altitudeGain) {
        totalAltitudeGain += d.altitudeGain;
      }
      if (d.elevation && d.elevation > highestElevation) {
        highestElevation = d.elevation;
      }
    });

    return {
      total: allDiscoveries.length,
      statusCounts,
      regionCounts,
      totalAltitudeGain,
      highestElevation,
    };
  },
  ['exploration-stats-cache'],
  { tags: ['discoveries', 'exploration-stats'], revalidate: 3600 }
);

export async function getExplorationStats() {
  return await getExplorationStatsCached();
}



export async function addJournalEntry(discoveryId: string, data: { title: string; content: string }) {
  const [entry] = await db.insert(journalEntries).values({
    discoveryId,
    title: data.title,
    content: data.content,
    date: new Date(),
  }).returning();

  revalidateTag('discoveries', { expire: 0 });
  revalidateTag('discovery-detail', { expire: 0 });
  revalidatePath(`/dossier/${discoveryId}`);
  return entry;
}


