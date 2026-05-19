import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { discoveries, media } from './schema';
import { Difficulty, FileType } from './enums';

const connectionString = process.env.DATABASE_URL || 'postgresql://terrain_explorer:supersecretmountainpassword@localhost:5432/terrain_vault_dev';
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  console.log('🏔️ Initializing Terrain Vault Seeding Process...');

  await db.delete(media);
  await db.delete(discoveries);
  console.log(`🧹 Cleared existing records.`);

  const seedData = [
    {
      name: 'Khumbu Icefall & Western Cwm',
      localName: 'Khumbu Glacier',
      latitude: 27.986,
      longitude: 86.922,
      elevation: 5486,
      region: 'Khumbu / Everest',
      state: 'Sagarmatha',
      country: 'Nepal',
      routeNotes: 'Extremely volatile shifting seracs. Approach requires alpine start before 3 AM to avoid thermal collapse. Ladders maintained by Icefall Doctors.',
      difficulty: Difficulty.EXTREME,
      technicality: 'Grade IV Ice Climbing, Crevasse Navigation',
      bestSeason: 'April - May',
      waterSources: 'Meltwater at Base Camp, boiling required.',
      campsites: 'Everest Base Camp (5,364m), Camp 1 (6,065m)',
      permits: 'Sagarmatha National Park Permit, Khumbu Pasang Lhamu Entry Ticket',
      riskNotes: 'High avalanche and serac fall hazard. Severe altitude.',
      acclimatization: 'Minimum 5 days at EBC before first rotation.',
      altitudeGain: 700,
      crowdLevel: 'Crowded',
      remotenessScore: 6,
      whySaved: 'The ultimate passage to the roof of the world. Essential research for high altitude glacier logistics.',
      expeditionDreams: 'Traverse the Western Cwm in absolute silence during a clear moonlit night.',
      externalLinks: ['https://en.wikipedia.org/wiki/Khumbu_Icefall'],
      mediaItems: [
        {
          name: 'Khumbu Icefall Overview',
          fileType: FileType.IMAGE,
          url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
          key: 'images/khumbu.jpg',
          size: 1024000,
          mimeType: 'image/jpeg',
        },
      ],
    },
    {
      name: 'Snow Lake & Biafo Glacier',
      localName: 'Lukpe Lawo',
      latitude: 35.983,
      longitude: 75.55,
      elevation: 4877,
      region: 'Karakoram',
      state: 'Gilgit-Baltistan',
      country: 'Pakistan',
      routeNotes: 'A 16km wide glacial basin at the head of the Biafo and Hispar glaciers. Unearthly isolation. Navigation difficult in whiteout conditions.',
      difficulty: Difficulty.TECHNICAL,
      technicality: 'Roped glacier travel, crevasse rescue proficiency mandatory',
      bestSeason: 'July - August',
      waterSources: 'Glacial streams on lateral moraine.',
      campsites: 'Karpogoro, Hispar La Base Camp',
      permits: 'NOC from Ministry of Tourism Pakistan, Licensed Guide required',
      riskNotes: 'Extreme isolation. Nearest helicopter rescue is hours away and weather dependent.',
      acclimatization: 'Progressive trek up Biafo Glacier over 6 days.',
      altitudeGain: 1800,
      crowdLevel: 'Isolated',
      remotenessScore: 10,
      whySaved: 'One of the most remote mountain basins on Earth. The Martin Conway descriptions from 1892 are mesmerizing.',
      expeditionDreams: 'Complete the full Biafo-Hispar traverse over Hispar La.',
      externalLinks: ['https://en.wikipedia.org/wiki/Snow_Lake_(Pakistan)'],
      mediaItems: [
        {
          name: 'Snow Lake Basin',
          fileType: FileType.IMAGE,
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
          key: 'images/snowlake.jpg',
          size: 2048000,
          mimeType: 'image/jpeg',
        },
      ],
    },
    {
      name: 'Annapurna Sanctuary Approach',
      localName: 'Annapurna Base Camp',
      latitude: 28.53,
      longitude: 83.878,
      elevation: 4130,
      region: 'Annapurna Himal',
      state: 'Gandaki',
      country: 'Nepal',
      routeNotes: 'Steep gorge entrance through Modi Khola. Massive vertical relief surrounded by 7,000m+ peaks.',
      difficulty: Difficulty.STRENUOUS,
      technicality: 'Steep stone staircases, avalanche chutes across trail near Deurali',
      bestSeason: 'October - November',
      waterSources: 'Teahouses and natural springs along trail.',
      campsites: 'Machhapuchhre Base Camp (MBC), Annapurna Base Camp (ABC)',
      permits: 'ACAP, TIMS Card',
      riskNotes: 'Avalanche danger between Dovan and MBC during heavy snowfall.',
      acclimatization: 'Spend night at Ghorepani or Chhomrong before ascending above 3000m.',
      altitudeGain: 3100,
      crowdLevel: 'Moderate',
      remotenessScore: 5,
      whySaved: 'Classic amphitheater of giants. Perfect terrain for testing lightweight expedition gear.',
      expeditionDreams: 'Explore the high ridges above MBC away from the main trekking trail.',
      externalLinks: ['https://en.wikipedia.org/wiki/Annapurna_Sanctuary'],
      mediaItems: [
        {
          name: 'Annapurna South Face',
          fileType: FileType.IMAGE,
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          key: 'images/annapurna.jpg',
          size: 1500000,
          mimeType: 'image/jpeg',
        },
      ],
    },
    {
      name: 'Larkya La Pass',
      localName: 'Larke Pass',
      latitude: 28.665,
      longitude: 84.624,
      elevation: 5106,
      region: 'Manaslu Circuit',
      state: 'Gandaki',
      country: 'Nepal',
      routeNotes: 'Long gradual approach past Dharmasala. Steep, icy descent on the Bimtang side requiring microspikes or crampons.',
      difficulty: Difficulty.STRENUOUS,
      technicality: 'High altitude trekking, icy trail conditions',
      bestSeason: 'October - May',
      waterSources: 'Dharmasala glacial melt.',
      campsites: 'Dharmasala (4460m), Bimtang (3720m)',
      permits: 'Manaslu Restricted Area Permit (RAP), MCAP, ACAP',
      riskNotes: 'High wind chill and freezing temperatures at the pass. Rapid weather changes.',
      acclimatization: 'Acclimatization hike at Samagaon to Pungyen Gompa or Manaslu Base Camp.',
      altitudeGain: 1400,
      crowdLevel: 'Moderate',
      remotenessScore: 7,
      whySaved: 'Spectacular panorama of Cheo Himal, Himlung Himal, and Kang Guru.',
      expeditionDreams: 'Cross the pass during early winter before snow closes the route.',
      externalLinks: ['https://en.wikipedia.org/wiki/Manaslu'],
      mediaItems: [
        {
          name: 'Larkya La Panorama',
          fileType: FileType.IMAGE,
          url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
          key: 'images/larkya.jpg',
          size: 1800000,
          mimeType: 'image/jpeg',
        },
      ],
    },
    {
      name: 'Rupal Face Base Camp',
      localName: 'Nanga Parbat South Base',
      latitude: 35.228,
      longitude: 74.589,
      elevation: 3570,
      region: 'Nanga Parbat Himal',
      state: 'Gilgit-Baltistan',
      country: 'Pakistan',
      routeNotes: 'Direct view of the 4,600m high Rupal Face—the highest mountain precipice in the world. Lush green meadows contrasting with immense vertical ice.',
      difficulty: Difficulty.MODERATE,
      technicality: 'Easy trekking approach from Tarashing',
      bestSeason: 'June - September',
      waterSources: 'Glacial streams right beside campsite.',
      campsites: 'Herrligkoffer Base Camp, Latobah Meadow',
      permits: 'Standard trekking registration',
      riskNotes: 'Rockfall and ice avalanches constantly thunder down the face, though campsite is safe.',
      acclimatization: 'Gentle ascent from Astor Valley.',
      altitudeGain: 650,
      crowdLevel: 'Isolated',
      remotenessScore: 8,
      whySaved: 'The sheer scale of the Rupal Face defies human imagination. A place for pure contemplation.',
      expeditionDreams: 'Camp at Latobah during the full moon to watch the ice face glow.',
      externalLinks: ['https://en.wikipedia.org/wiki/Nanga_Parbat'],
      mediaItems: [
        {
          name: 'Rupal Face Wall',
          fileType: FileType.IMAGE,
          url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
          key: 'images/rupal.jpg',
          size: 1950000,
          mimeType: 'image/jpeg',
        },
      ],
    },
    {
      name: 'Gokyo Ri & Sacred Lakes',
      localName: 'Gokyo Cho',
      latitude: 27.955,
      longitude: 86.694,
      elevation: 5357,
      region: 'Khumbu / Everest',
      state: 'Sagarmatha',
      country: 'Nepal',
      routeNotes: 'Ascent of Gokyo Ri provides the most comprehensive view of Everest, Lhotse, Makalu, and Cho Oyu. The turquoise oligotrophic lakes are breathtaking.',
      difficulty: Difficulty.STRENUOUS,
      technicality: 'Steep scree switchbacks on Gokyo Ri',
      bestSeason: 'October - November',
      waterSources: 'Teahouses at Gokyo village.',
      campsites: 'Gokyo Village (4790m)',
      permits: 'Sagarmatha National Park Permit',
      riskNotes: 'Acute Mountain Sickness on Gokyo Ri climb if unacclimatized.',
      acclimatization: 'Stay 2 nights at Machhermo before arriving at Gokyo.',
      altitudeGain: 1100,
      crowdLevel: 'Moderate',
      remotenessScore: 6,
      whySaved: 'Far superior panoramic vantage point compared to Kala Patthar. The Ngozumpa Glacier crossing is dramatic.',
      expeditionDreams: 'Cross Renjo La Pass at dawn to see the sun hit Everest across the lake.',
      externalLinks: ['https://en.wikipedia.org/wiki/Gokyo_Lakes'],
      mediaItems: [
        {
          name: 'Gokyo Lakes View',
          fileType: FileType.IMAGE,
          url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80',
          key: 'images/gokyo.jpg',
          size: 1400000,
          mimeType: 'image/jpeg',
        },
      ],
    },
  ];

  for (const item of seedData) {
    const { mediaItems, ...fields } = item;
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
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }
  }

  console.log(`✅ Successfully seeded ${seedData.length} pristine mountain records into Terrain Vault.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
