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

export function flexMatch(answer, correct) {
  const a = normalizeNumerals(answer.toLowerCase().trim());
  const c = correct.toLowerCase();
  if (a === c) return true;

  const cTokens = tokenize(c);
  const aTokens = new Set(tokenize(a));

  // Use only meaningful (non-stop) words for both threshold and overlap,
  // so "eat" passes for "to eat" and stop-word-only answers always fail.
  const cMeaningful = cTokens.filter(w => !STOP_WORDS.has(w));
  const basis = cMeaningful.length > 0 ? cMeaningful : cTokens;
  const threshold = Math.max(1, Math.floor(basis.length / 2));

  const overlap = basis.filter(w => aTokens.has(w)).length;
  return overlap >= threshold;
}
