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
  const a = answer.toLowerCase().trim();
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
