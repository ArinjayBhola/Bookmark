'use server';

import { db } from '@/db';
import { inboxItems, media, discoveries } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { FileType } from '@/db/enums';

export async function getInboxItems() {
  return await db.query.inboxItems.findMany({
    where: eq(inboxItems.processed, false),
    with: {
      media: true,
    },
    orderBy: [desc(inboxItems.createdAt)],
  });
}

export async function createInboxItem(data: {
  title?: string;
  rawNotes?: string;
  urlDump?: string;
  media?: { name: string; fileType: FileType; url: string; key: string; size: number; mimeType: string }[];
}) {
  const [item] = await db.insert(inboxItems).values({
    title: data.title || 'Untitled Dump',
    rawNotes: data.rawNotes || '',
    urlDump: data.urlDump || '',
    processed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  if (data.media && data.media.length > 0) {
    await db.insert(media).values(
      data.media.map((m) => ({
        ...m,
        inboxItemId: item.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }

  revalidatePath('/');
  return item;
}

export async function processInboxItem(id: string, discoveryId?: string) {
  // If an existing discovery is chosen, link all media to it and append rawNotes/urlDump to its routeNotes or custom field
  if (discoveryId) {
    const item = await db.query.inboxItems.findFirst({
      where: eq(inboxItems.id, id),
      with: {
        media: true,
      },
    });

    if (item) {
      // 1. Update media elements to refer to this discovery
      if (item.media && item.media.length > 0) {
        for (const m of item.media) {
          await db
            .update(media)
            .set({ discoveryId, inboxItemId: null, updatedAt: new Date() })
            .where(eq(media.id, m.id));
        }
      }

      // 2. Fetch the current discovery to append text notes
      const discovery = await db.query.discoveries.findFirst({
        where: eq(discoveries.id, discoveryId),
      });

      if (discovery) {
        let updatedNotes = discovery.routeNotes || '';
        if (item.rawNotes) {
          updatedNotes += `\n\n[Buffered Notes]: ${item.rawNotes}`;
        }
        if (item.urlDump) {
          updatedNotes += `\n\n[Buffered Reference Link]: ${item.urlDump}`;
        }

        const externalLinks = [...(discovery.externalLinks || [])];
        if (item.urlDump && !externalLinks.includes(item.urlDump)) {
          externalLinks.push(item.urlDump);
        }

        await db
          .update(discoveries)
          .set({
            routeNotes: updatedNotes.trim(),
            externalLinks,
            updatedAt: new Date(),
          })
          .where(eq(discoveries.id, discoveryId));
      }
    }
  }

  // Mark the item as processed
  const [processedItem] = await db
    .update(inboxItems)
    .set({ processed: true, updatedAt: new Date() })
    .where(eq(inboxItems.id, id))
    .returning();

  revalidateTag('discoveries', { expire: 0 });
  revalidatePath('/');
  revalidatePath('/tracking');
  if (discoveryId) {
    revalidatePath(`/dossier/${discoveryId}`);
  }

  return processedItem;
}

export async function deleteInboxItem(id: string) {
  await db.delete(inboxItems).where(eq(inboxItems.id, id));
  revalidatePath('/');
  return true;
}
