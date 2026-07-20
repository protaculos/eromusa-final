import stylesRaw from './styles.json';

// ============================================
// Types
// ============================================
export interface Template {
  id: string;
  title: string;
  thumbnail: string;
  isFree: boolean;
  isPopular: boolean;
  tags: string[];
  videoUrl: string;
  gradient: string;
  duration: string;
  credits: number;
  instructions: string[];
  styleId: string;
}

interface StyleRaw {
  id: string;
  name: string;
  cost: number;
  type: string;
  has_options: boolean;
  options: any;
  options_type: any;
  boolean_categories: any;
  requires_user_phrase: boolean;
  user_phrase_max_words: any;
}

// ============================================
// Gradients
// ============================================
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

// ============================================
// Helpers
// ============================================
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function generateTags(name: string): string[] {
  const words = name.toLowerCase().split(/[\s&]+/);
  const tags: string[] = [];
  for (const word of words) {
    const clean = word.replace(/[^a-z0-9]/g, '');
    if (clean && clean.length > 2 && !['v2', 'the'].includes(clean)) {
      tags.push(clean);
    }
  }
  return tags.length > 0 ? tags : [slugify(name)];
}

// ============================================
// Excluded categories (gay, trans)
// ============================================
const EXCLUDED_STYLES = new Set([
  'gay-anal-sex',
  'gay-facial',
  'gay-blowjob',
  'gay-bbc-deepthroath',
  'gay-pov-kissing',
  'trans-blowjob-female',
  'man-blowjob-to-trans-woman',
  'trans-handjob-pov',
  'trans-handjob-cumshot',
  'trans-zoom-out',
]);

// ============================================
// Build templates from styles.json
// ============================================
const data = stylesRaw as { video_styles: StyleRaw[] };

const heteroStyles = data.video_styles.filter(s => !EXCLUDED_STYLES.has(s.id));

// Track duplicate names (e.g. two "Rough Doggy" scenes)
const nameCount: Record<string, number> = {};

export const allTemplates: Template[] = heteroStyles.map((style, index) => {
  let folderName = slugify(style.name);
  if (nameCount[folderName]) {
    nameCount[folderName]++;
    folderName = folderName + '_' + nameCount[folderName];
  } else {
    nameCount[folderName] = 1;
  }

  return {
    id: String(index + 1),
    title: style.name,
    thumbnail: `/videos/${folderName}/poster.webp`,
    isFree: index < 15,
    isPopular: index % 3 === 0,
    tags: generateTags(style.name),
    videoUrl: `/videos/${folderName}/loop.mp4`,
    gradient: gradients[index % gradients.length],
    duration: '15s',
    credits: Math.round(style.cost * 100),
    instructions: ['Upper body photo', 'Good lighting', 'Facing camera', 'Natural pose'],
    styleId: style.id,
  };
});
