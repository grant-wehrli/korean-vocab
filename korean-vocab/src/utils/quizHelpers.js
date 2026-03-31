export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildQueue(words, store, forceAll) {
  const today = new Date().toISOString().split('T')[0];
  const due = forceAll
    ? words
    : words.filter(w => {
        const card = store.cards[w.kr];
        return !card || card.nextReview <= today;
      });
  return shuffle(due);
}

const DIGIT_TO_WORD = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
  '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
  '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
  '18': 'eighteen', '19': 'nineteen', '20': 'twenty',
  '100': 'hundred', '1000': 'thousand',
};

function normalizeNumerals(str) {
  return str.replace(/\b\d+\b/g, n => DIGIT_TO_WORD[n] ?? n);
}

// Common spelling/abbreviation variants that should be treated as equivalent
const VARIANT_MAP = {
  'ok': 'okay',
  'alright': 'okay',
};

function normalizeVariants(str) {
  return str.replace(/\b\w+\b/g, w => VARIANT_MAP[w] ?? w);
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'i', 'it', 'its', 'is', 'are', 'was', 'be',
  'you', 'of', 'in', 'on', 'at',
]);

function tokenize(str) {
  return str
    .toLowerCase()
    .replace(/[()\/\-?!.,'"]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function flexMatchSingle(answer, correct) {
  const a = normalizeVariants(normalizeNumerals(answer.toLowerCase().trim()));
  const c = normalizeVariants(correct.toLowerCase());
  if (a === c) return true;

  const cTokens = tokenize(c);
  const aTokens = new Set(tokenize(a));
  const aTokenArr = [...aTokens];

  // Use only meaningful (non-stop) words for both threshold and overlap,
  // so "eat" passes for "to eat" and stop-word-only answers always fail.
  const cMeaningful = cTokens.filter(w => !STOP_WORDS.has(w));
  const basis = cMeaningful.length > 0 ? cMeaningful : cTokens;
  const threshold = Math.max(1, Math.floor(basis.length / 2));

  const overlap = basis.filter(w => aTokens.has(w)).length;
  if (overlap >= threshold) return true;

  // Levenshtein fallback: accept if any answer token is within 1 edit of any
  // basis word, for words long enough that 1 edit can't cause false positives.
  const fuzzy = basis.some(w =>
    w.length >= 4 && aTokenArr.some(t => t.length >= 4 && levenshtein(t, w) <= 1)
  );
  return fuzzy;
}

// Checks answer against correct and any supplied alternative phrasings.
export function flexMatch(answer, correct, alts = []) {
  if (flexMatchSingle(answer, correct)) return true;
  return alts.some(alt => flexMatchSingle(answer, alt));
}

// For ReverseQuiz: accepts exact Korean/romanization OR the same without
// a trailing 요 / yo politeness suffix.
export function romFlexMatch(answer, card) {
  const a = answer.trim().toLowerCase();
  const kr = card.kr;
  const rom = card.rom.toLowerCase();

  if (a === kr || a === rom) return true;

  // Strip trailing 요 from Korean
  if (kr.endsWith('요')) {
    const krBase = kr.slice(0, -1);
    if (a === krBase) return true;
  }

  // Strip trailing yo from romanization
  if (rom.endsWith('yo')) {
    const romBase = rom.slice(0, -2);
    if (romBase.length > 0 && a === romBase) return true;
  }

  return false;
}
