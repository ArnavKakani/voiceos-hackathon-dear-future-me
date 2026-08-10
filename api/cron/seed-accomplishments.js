import { createClient } from '@supabase/supabase-js';

const SAMPLE_PREFIX = 'Sample: ';
const SEED_COUNT = 100;

// Keep this list in sync with the DB trigger (see supabase migrations) so we don't
// generate sample content that will be rejected at insert time.
const BAD_WORDS = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'dick',
  'pussy',
  'cock',
  'cunt',
  'bastard',
  'whore',
  'slut',
  'piss',
  'nigger',
  'faggot',
  'retard',
  'damn',
  'hell',
  'penis',
  'vagina',
  'boob',
  'tit',
];

function hasBannedWord(text) {
  // Approximate Postgres word-boundary match used by the trigger.
  return BAD_WORDS.some((w) => new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i').test(text));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Deterministic PRNG so the "set of 100" stays stable across deployments.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function capitalizeFirst(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function maybePeriod(s) {
  if (!s) return s;
  const last = s[s.length - 1];
  if (last === '.' || last === '!' || last === '?') return s;
  return `${s}.`;
}

function normalizeSpacing(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function generateSampleAccomplishments({ count, seed }) {
  const rng = mulberry32(seed);

  const starters = ['Today I', 'This week I', 'Recently I', 'I'];
  const verbs = [
    'made',
    'finished',
    'started',
    'kept',
    'stuck to',
    'showed up for',
    'followed through on',
    'asked for',
    'said no to',
    'took time to',
    'reached out to',
    'apologized for',
    'forgave myself for',
    'tried',
    'learned',
    'practiced',
  ];

  const smallWins = [
    'a 10 minute walk',
    'my laundry without letting it pile up',
    'my dishes before bed',
    'a healthy-ish breakfast',
    'a small workout at home',
    'reading a few pages before scrolling',
    'drinking water before coffee',
    'putting my phone in another room while I worked',
    'cleaning out my backpack',
    'organizing my desktop and downloads folder',
    'making my bed even though it felt pointless',
    'taking a break when I noticed burnout',
    'writing down what I was grateful for',
    'being on time (barely, but still)',
    'going outside for sunlight',
    'turning in an assignment I was embarrassed by',
    'asking a teacher a question after class',
    'going to office hours for the first time',
    'studying with a friend instead of alone',
    'a budget for the week and actually used it',
    'a meal for myself instead of skipping',
    'a playlist that matched my mood and helped me reset',
    'a list of tiny tasks and checked off three of them',
    'my room a little nicer to exist in',
    'a hard conversation I kept avoiding',
    'a scary email I had been putting off',
    'a decision without overthinking it for hours',
    'a plan for tomorrow that feels realistic',
    'a promise I made to myself last month',
    'a boundary without explaining it a million times',
  ];

  const contexts = [
    'even though I was nervous',
    'even though I did not feel like it',
    'without waiting to feel motivated',
    'and it helped more than I expected',
    'and I am proud of myself for it',
    'and nobody else would notice, but I did',
    'and I did not quit halfway',
    'and I stopped when I needed to stop',
    'and I did it imperfectly on purpose',
    'and it made the rest of the day easier',
  ];

  const kindness = [
    'held the door for someone with too many bags',
    'sent a check-in text to a friend',
    'complimented someone genuinely',
    'helped someone study without making them feel bad',
    'left a nice note for a roommate or family member',
    'thanked someone who usually gets ignored',
    'picked up litter on my walk',
    'let someone merge in traffic and stayed calm about it',
  ];

  const growth = [
    'asked for help when I was overwhelmed',
    'took a break instead of pushing through exhaustion',
    'told the truth instead of people-pleasing',
    'stopped doom-scrolling when I noticed it',
    'went to bed earlier for two nights in a row',
    'set a timer and started the thing I was avoiding',
    'made space for my feelings without trying to fix them',
    'chose a smaller goal instead of giving up',
    'stayed kind to myself after a mistake',
    'did something alone and enjoyed it',
  ];

  const templates = [
    () =>
      `${pick(rng, starters)} ${pick(rng, verbs)} ${pick(rng, smallWins)} ${pick(rng, contexts)}`,
    () => `${pick(rng, starters)} ${pick(rng, kindness)} ${pick(rng, contexts)}`,
    () => `${pick(rng, starters)} ${pick(rng, growth)} ${pick(rng, contexts)}`,
    () =>
      `I noticed I was spiraling and I ${pick(rng, [
        'paused',
        'took three deep breaths',
        'went for a short walk',
        'wrote down what I could control',
        'asked someone to sit with me',
      ])}`,
    () =>
      `I did not compare myself to anyone today. I just ${pick(rng, [
        'did my next tiny step',
        'focused on my own pace',
        'kept going quietly',
        'celebrated one small win',
        'showed up anyway',
      ])}`,
    () =>
      `I ${pick(rng, [
        'made a list of what matters to me',
        're-read something I wrote months ago',
        'deleted an app that was making me anxious',
        'unfollowed accounts that made me feel worse',
        'cleaned up my space to calm my brain',
      ])} ${pick(rng, contexts)}`,
    () =>
      `I handled a tiny adult task: ${pick(rng, [
        'called to make an appointment',
        'filled out a form I had been avoiding',
        'sent an email I was scared to send',
        'asked a question instead of guessing',
        'followed up on something I kept postponing',
      ])}`,
    () =>
      `I showed myself respect by ${pick(rng, [
        'eating when I was hungry',
        'moving my body gently',
        'taking a real break',
        'asking for clarity instead of assuming',
        'leaving a situation that felt off',
      ])}`,
  ];

  const out = [];
  const seen = new Set();

  // Generous guard to avoid infinite loops if templates collide.
  for (let attempts = 0; out.length < count && attempts < count * 200; attempts += 1) {
    const raw = pick(rng, templates)();
    const normalized = maybePeriod(capitalizeFirst(normalizeSpacing(raw)));

    if (normalized.length < 18 || normalized.length > 260) continue;
    if (hasBannedWord(normalized)) continue;
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    out.push(normalized);
  }

  if (out.length !== count) {
    throw new Error(`Seed generator produced ${out.length}/${count} unique entries.`);
  }

  return out;
}

function utcDayRange(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
  const dayKey = start.toISOString().slice(0, 10);
  return { startIso: start.toISOString(), endIso: end.toISOString(), dayKey };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Missing Supabase environment variables',
      requiredAnyOf: ['SUPABASE_URL or VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY'],
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const seeds = generateSampleAccomplishments({
      count: SEED_COUNT,
      seed: 0xdefa17, // stable "random" order
    });

    const now = new Date();
    const { startIso, endIso, dayKey } = utcDayRange(now);

    // Only allow one seeded insert per UTC day.
    const seededToday = await supabase
      .from('accomplishments')
      .select('id', { count: 'exact', head: true })
      .like('content', `${SAMPLE_PREFIX}%`)
      .gte('created_at', startIso)
      .lt('created_at', endIso);

    if (seededToday.error) throw seededToday.error;

    if ((seededToday.count || 0) > 0) {
      return res.status(200).json({
        status: 'noop',
        reason: 'already_seeded_today',
        day: dayKey,
      });
    }

    const seededTotal = await supabase
      .from('accomplishments')
      .select('id', { count: 'exact', head: true })
      .like('content', `${SAMPLE_PREFIX}%`);

    if (seededTotal.error) throw seededTotal.error;

    const nextIndex = seededTotal.count || 0;

    if (nextIndex >= seeds.length) {
      return res.status(200).json({
        status: 'done',
        day: dayKey,
        seededTotal: nextIndex,
        seedMax: seeds.length,
      });
    }

    const content = `${SAMPLE_PREFIX}${seeds[nextIndex]}`;

    const inserted = await supabase.from('accomplishments').insert([{ content }]);
    if (inserted.error) throw inserted.error;

    return res.status(200).json({
      status: 'seeded',
      day: dayKey,
      insertedIndex: nextIndex,
      remaining: seeds.length - nextIndex - 1,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}

