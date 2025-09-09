// backfill.js
// Backfills Surveys docs with default booleans (isPublic, statsPublic)
// Logs every change. Supports DRY_RUN=1 to preview without writing.
//
// Usage:
//   node --env-file=.env.server backfill.js
//   DRY_RUN=1 node --env-file=.env.server backfill.js

import 'dotenv/config';
import { Client, Databases, Query } from 'node-appwrite';

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  DB_ID = 'app',      // <-- change if your DB id is different
  SURVEYS_ID = 'surveys',
  DRY_RUN,
} = process.env;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error('❌ Missing required env vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const db = new Databases(client);

function clip(s, n = 40) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

async function listAllSurveys() {
  const all = [];
  let cursor = undefined;

  while (true) {
    const queries = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await db.listDocuments(DB_ID, SURVEYS_ID, queries);
    all.push(...page.documents);

    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }
  return all;
}

async function run() {
  console.log(`🔧 Backfill starting (DB="${DB_ID}", collection="${SURVEYS_ID}", dryRun=${!!DRY_RUN})`);

  const surveys = await listAllSurveys();
  console.log(`📄 Found ${surveys.length} survey docs\n`);

  let updated = 0;
  let skipped = 0;

  for (const doc of surveys) {
    const patch = {};
    if (typeof doc.isPublic !== 'boolean') patch.isPublic = true;
    if (typeof doc.statsPublic !== 'boolean') patch.statsPublic = true;

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    const before = { isPublic: doc.isPublic, statsPublic: doc.statsPublic };
    const after = { isPublic: patch.isPublic ?? doc.isPublic, statsPublic: patch.statsPublic ?? doc.statsPublic };

    if (DRY_RUN) {
      console.log(
        `• [DRY] ${doc.$id}  "${clip(doc.title || '(untitled)')}"  ` +
        `isPublic: ${before.isPublic} → ${after.isPublic},  statsPublic: ${before.statsPublic} → ${after.statsPublic}`
      );
    } else {
      await db.updateDocument(DB_ID, SURVEYS_ID, doc.$id, patch);
      console.log(
        `✓ UPDATED ${doc.$id}  "${clip(doc.title || '(untitled)')}"  ` +
        `isPublic: ${before.isPublic} → ${after.isPublic},  statsPublic: ${before.statsPublic} → ${after.statsPublic}`
      );
    }
    updated++;
  }

  console.log(`\n✅ Backfill complete. Updated: ${updated}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err?.response ?? err);
  process.exit(1);
});
