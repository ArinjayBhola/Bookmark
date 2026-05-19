'use server';

import { db } from '@/db';
import { expeditionGear } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getExpeditionGear(discoveryId: string) {
  if (!discoveryId) return [];
  return await db.query.expeditionGear.findMany({
    where: eq(expeditionGear.discoveryId, discoveryId),
    orderBy: [expeditionGear.category, expeditionGear.itemName],
  });
}

export async function createGearItem(data: { discoveryId: string; itemName: string; category: string }) {
  const [item] = await db.insert(expeditionGear).values({
    discoveryId: data.discoveryId,
    itemName: data.itemName.trim(),
    category: data.category,
    packed: false,
  }).returning();

  revalidatePath(`/dossier/${data.discoveryId}`);
  return item;
}

export async function toggleGearItem(id: string, packed: boolean, discoveryId: string) {
  const [updated] = await db
    .update(expeditionGear)
    .set({ packed, updatedAt: new Date() })
    .where(eq(expeditionGear.id, id))
    .returning();

  revalidatePath(`/dossier/${discoveryId}`);
  return updated;
}

export async function deleteGearItem(id: string, discoveryId: string) {
  await db.delete(expeditionGear).where(eq(expeditionGear.id, id));
  revalidatePath(`/dossier/${discoveryId}`);
  return true;
}

// Gear Presets based on terrain category
const PRESETS: Record<string, Array<{ itemName: string; category: string }>> = {
  GLACIER: [
    { itemName: 'Climbing Harness', category: 'Equipment' },
    { itemName: 'Crampons (compatible with boots)', category: 'Equipment' },
    { itemName: 'Ice Axe', category: 'Equipment' },
    { itemName: 'Dynamic Dry-Treated Rope (50m)', category: 'Equipment' },
    { itemName: 'Crevasse Rescue Kit (Prusiks, carabiners, pulleys)', category: 'Safety & Navigation' },
    { itemName: 'UV Protection Glacier Sunglasses', category: 'Safety & Navigation' },
    { itemName: 'Warm Fleece Gloves & Outer Shell Mittens', category: 'Apparel' },
    { itemName: 'Helmet', category: 'Equipment' },
  ],
  CAMPSITE: [
    { itemName: '4-Season Expedition Tent', category: 'Camp & Pack' },
    { itemName: 'Down Sleeping Bag (rated to -10°C or lower)', category: 'Camp & Pack' },
    { itemName: 'Insulated Sleeping Pad', category: 'Camp & Pack' },
    { itemName: 'Multifuel Camp Stove & Fuel canister', category: 'Camp & Pack' },
    { itemName: 'Dehydrated Meals & Alpine Trail Mix', category: 'Camp & Pack' },
    { itemName: 'Water Purification Tablets / Filter', category: 'Safety & Navigation' },
  ],
  ROUTE: [
    { itemName: 'Alpine Backpack (40-50L)', category: 'Camp & Pack' },
    { itemName: 'Warm Insulated Down Jacket', category: 'Apparel' },
    { itemName: 'Hardshell Wind/Waterproof Jacket', category: 'Apparel' },
    { itemName: 'Sturdy Mountaineering Boots', category: 'Apparel' },
    { itemName: 'Headlamp with spare batteries', category: 'Safety & Navigation' },
    { itemName: 'Basic First Aid Kit', category: 'Safety & Navigation' },
    { itemName: 'Thermal Base Layers (Top & Bottom)', category: 'Apparel' },
    { itemName: 'Trekking Poles', category: 'Equipment' },
    { itemName: 'Printed Topographic Map & Compass', category: 'Safety & Navigation' },
    { itemName: 'Garmin GPS / satellite messenger', category: 'Safety & Navigation' },
    { itemName: 'Powerbank (10,000mAh+) for devices', category: 'Safety & Navigation' },
    { itemName: 'Alpine Pocket Knife / Multitool', category: 'Equipment' },
  ],
};

export async function loadGearPresets(discoveryId: string, category: string) {
  const items = PRESETS[category] || PRESETS['ROUTE'];

  const inserted = [];
  for (const item of items) {
    const [insertedItem] = await db.insert(expeditionGear).values({
      discoveryId,
      itemName: item.itemName,
      category: item.category,
      packed: false,
    }).returning();
    inserted.push(insertedItem);
  }

  revalidatePath(`/dossier/${discoveryId}`);
  return inserted;
}
