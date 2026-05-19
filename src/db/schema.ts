import { pgTable, text, doublePrecision, integer, timestamp, boolean, pgEnum, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const difficultyEnum = pgEnum('Difficulty', [
  'EASY',
  'MODERATE',
  'STRENUOUS',
  'TECHNICAL',
  'EXTREME',
]);

export const fileTypeEnum = pgEnum('FileType', [
  'IMAGE',
  'VIDEO',
  'GPX',
  'DOCUMENT',
  'MAP',
]);

// Tables
export const discoveries = pgTable(
  'Discovery',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).defaultNow().notNull().$onUpdateFn(() => new Date()),

    // Location Data
    name: text('name').notNull(),
    localName: text('localName'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    elevation: doublePrecision('elevation'), // in meters
    region: text('region'),
    state: text('state'),
    country: text('country'),

    // Expedition Data
    routeNotes: text('routeNotes'),
    difficulty: difficultyEnum('difficulty').default('MODERATE'),
    technicality: text('technicality'),
    bestSeason: text('bestSeason'),
    waterSources: text('waterSources'),
    campsites: text('campsites'),
    permits: text('permits'),
    riskNotes: text('riskNotes'),
    acclimatization: text('acclimatization'),
    altitudeGain: doublePrecision('altitudeGain'), // in meters
    crowdLevel: text('crowdLevel'),
    remotenessScore: integer('remotenessScore'), // 1 to 10

    // Personal Data
    whySaved: text('whySaved'),
    expeditionDreams: text('expeditionDreams'),
    futureIdeas: text('futureIdeas'),
    emotionalNotes: text('emotionalNotes'),
    comparisons: text('comparisons'),

    // External Links & Custom Info
    externalLinks: text('externalLinks').array().notNull().default([]),
    customInfo: jsonb('customInfo').default([]),
  },
  (table) => [
    index('Discovery_latitude_longitude_idx').on(table.latitude, table.longitude),
    index('Discovery_region_idx').on(table.region),
    index('Discovery_createdAt_idx').on(table.createdAt),
  ]
);

export const media = pgTable(
  'Media',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).defaultNow().notNull().$onUpdateFn(() => new Date()),

    name: text('name').notNull(),
    fileType: fileTypeEnum('fileType').notNull(),
    url: text('url').notNull(),
    key: text('key').notNull(),
    size: integer('size').notNull(),
    mimeType: text('mimeType').notNull(),

    discoveryId: text('discoveryId').references(() => discoveries.id, { onDelete: 'cascade' }),
    inboxItemId: text('inboxItemId').references(() => inboxItems.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('Media_discoveryId_idx').on(table.discoveryId),
    index('Media_inboxItemId_idx').on(table.inboxItemId),
    index('Media_fileType_idx').on(table.fileType),
  ]
);

export const inboxItems = pgTable(
  'InboxItem',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).defaultNow().notNull().$onUpdateFn(() => new Date()),

    title: text('title'),
    rawNotes: text('rawNotes'),
    urlDump: text('urlDump'),
    processed: boolean('processed').default(false).notNull(),
  },
  (table) => [
    index('InboxItem_processed_idx').on(table.processed),
    index('InboxItem_createdAt_idx').on(table.createdAt),
  ]
);

export const journalEntries = pgTable(
  'JournalEntry',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).defaultNow().notNull().$onUpdateFn(() => new Date()),

    title: text('title').notNull(),
    content: text('content').notNull(),
    date: timestamp('date', { precision: 3, mode: 'date' }).defaultNow().notNull(),

    discoveryId: text('discoveryId').notNull().references(() => discoveries.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('JournalEntry_discoveryId_idx').on(table.discoveryId),
    index('JournalEntry_date_idx').on(table.date),
  ]
);

export const expeditionGear = pgTable(
  'ExpeditionGear',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' }).defaultNow().notNull().$onUpdateFn(() => new Date()),

    itemName: text('itemName').notNull(),
    category: text('category').notNull(), // e.g. Apparel, Climbing Gear, Navigation, Camp & Kitchen
    packed: boolean('packed').default(false).notNull(),

    discoveryId: text('discoveryId').notNull().references(() => discoveries.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('ExpeditionGear_discoveryId_idx').on(table.discoveryId),
  ]
);

// Relations
export const discoveriesRelations = relations(discoveries, ({ many }) => ({
  media: many(media),
  journalEntries: many(journalEntries),
  expeditionGear: many(expeditionGear),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  discovery: one(discoveries, {
    fields: [media.discoveryId],
    references: [discoveries.id],
  }),
  inboxItem: one(inboxItems, {
    fields: [media.inboxItemId],
    references: [inboxItems.id],
  }),
}));

export const inboxItemsRelations = relations(inboxItems, ({ many }) => ({
  media: many(media),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  discovery: one(discoveries, {
    fields: [journalEntries.discoveryId],
    references: [discoveries.id],
  }),
}));

export const expeditionGearRelations = relations(expeditionGear, ({ one }) => ({
  discovery: one(discoveries, {
    fields: [expeditionGear.discoveryId],
    references: [discoveries.id],
  }),
}));

