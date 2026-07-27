/**
 * Script de Migração (sem dependências) — Pastas public/videos/ + styles.json → Supabase
 * Uso: node scripts/migrate-nodeps.cjs
 */
const fs = require('fs');
const path = require('path');

// ── Load .env.local ──────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  envVars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const API_BASE = `${SUPABASE_URL}/rest/v1`;
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1`;
const HEADERS = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// ── Helpers ──────────────────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const gradients = [
  "from-orange-500 via-pink-500 to-purple-600",
  "from-cyan-400 via-blue-500 to-purple-600",
  "from-amber-500 via-orange-500 to-rose-600",
  "from-gray-600 via-gray-500 to-zinc-700",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-yellow-400 via-amber-500 to-orange-500",
  "from-slate-700 via-gray-600 to-zinc-800",
  "from-fuchsia-500 via-pink-500 to-rose-600",
  "from-red-500 via-orange-500 to-yellow-500",
  "from-teal-400 via-cyan-500 to-blue-600",
  "from-purple-500 via-pink-500 to-red-500",
  "from-green-400 via-emerald-500 to-teal-600",
];

const EXCLUDED_STYLES = new Set([
  'gay-anal-sex', 'gay-facial', 'gay-blowjob', 'gay-bbc-deepthroath',
  'gay-pov-kissing', 'trans-blowjob-female', 'man-blowjob-to-trans-woman',
  'trans-handjob-pov', 'trans-handjob-cumshot', 'trans-zoom-out',
]);

// ── API helpers ──────────────────────────────────
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...HEADERS, ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

async function uploadToStorage(bucket, filePath, buffer) {
  const url = `${STORAGE_BASE}/object/${bucket}/${filePath}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...HEADERS,
      'Content-Type': 'video/webm',
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: HTTP ${res.status} - ${text.slice(0, 200)}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}

async function insertRecord(table, data) {
  const url = `${API_BASE}/${table}`;
  const res = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Prefer': 'return=representation' },
  });
  const json = await res.json();
  return Array.isArray(json) ? json[0] : json;
}

// ── Main ─────────────────────────────────────────
async function main() {
  console.log('🚀 Starting migration...\n');

  // 1. Load styles.json
  const stylesPath = path.resolve(__dirname, '../src/data/styles.json');
  const stylesRaw = JSON.parse(fs.readFileSync(stylesPath, 'utf-8'));
  const allStyles = stylesRaw.video_styles || stylesRaw;
  const heteroStyles = allStyles.filter(s => !EXCLUDED_STYLES.has(s.id) && s.type === 'video');

  console.log(`📦 Found ${heteroStyles.length} hetero video styles in styles.json`);

  // 2. Build style lookup by slug
  const styleBySlug = new Map();
  const nameCount = {};

  for (const style of heteroStyles) {
    let slug = slugify(style.name);
    if (nameCount[slug]) {
      nameCount[slug]++;
      slug = slug + '_' + nameCount[slug];
    } else {
      nameCount[slug] = 1;
    }
    styleBySlug.set(slug, style);
  }

  // 3. Scan video folders
  const videosDir = path.resolve(__dirname, '../public/videos');
  if (!fs.existsSync(videosDir)) {
    console.error('❌ public/videos/ directory not found');
    process.exit(1);
  }

  const folders = fs.readdirSync(videosDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`📁 Found ${folders.length} video folders\n`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of folders) {
    const videoPath = path.join(videosDir, folder, 'video.webm');
    if (!fs.existsSync(videoPath)) {
      console.log(`  ⏭️  ${folder}: no video.webm found`);
      skipped++;
      continue;
    }

    const style = styleBySlug.get(folder);
    if (!style) {
      console.log(`  ⏭️  ${folder}: no matching style found`);
      skipped++;
      continue;
    }

    try {
      // Upload video to Supabase Storage
      const fileBuffer = fs.readFileSync(videoPath);
      const storagePath = `${folder}/video.webm`;

      const publicUrl = await uploadToStorage('scene-videos', storagePath, fileBuffer);

      const gradient = gradients[uploaded % gradients.length];

      // Create scene record
      const scene = await insertRecord('scenes', {
        name: style.name,
        credits: Math.round(style.cost * 100),
        style_id: style.id,
        loop_video_url: publicUrl,
        gradient,
      });

      console.log(`  ✅ ${style.name} (${folder}) → ${publicUrl}`);
      uploaded++;
    } catch (err) {
      console.error(`  ❌ ${folder}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  ✅ Uploaded: ${uploaded}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors:  ${errors}`);

  // 4. Create initial categories
  console.log('\n📋 Creating initial categories...');

  const initialCategories = [
    { name: '🔥 Popular', order: 0 },
    { name: '🎯 Free', order: 1 },
    { name: 'Blowjob', order: 2 },
    { name: 'Anal', order: 3 },
    { name: 'Positions', order: 4 },
    { name: 'Sex', order: 5 },
    { name: 'Cum', order: 6 },
    { name: 'Foot', order: 7 },
    { name: 'Handjob', order: 8 },
    { name: 'POV', order: 9 },
    { name: 'Pussy', order: 10 },
    { name: 'Tits', order: 11 },
    { name: 'Pregnant', order: 12 },
    { name: 'BBC', order: 13 },
    { name: '69', order: 14 },
    { name: 'Kissing', order: 15 },
    { name: 'Squirt', order: 16 },
    { name: 'Toys', order: 17 },
    { name: 'Solo', order: 18 },
    { name: 'Other', order: 19 },
  ];

  for (const cat of initialCategories) {
    try {
      await insertRecord('categories', cat);
      console.log(`  ✅ ${cat.name}`);
    } catch (err) {
      if (err.message.includes('23505')) {
        console.log(`  ⏭️  ${cat.name}: already exists`);
      } else {
        console.log(`  ⚠️  ${cat.name}: ${err.message}`);
      }
    }
  }

  console.log('\n🎉 Migration complete!');
  console.log(`\nNext steps:`);
  console.log(`  1. Set role='admin' for your account in Supabase Dashboard`);
  console.log(`  2. Deploy to Vercel`);
}

main().catch(console.error);
