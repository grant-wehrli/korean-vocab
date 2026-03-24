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

export function flexMatch(answer, correct) {
  const a = answer.toLowerCase().trim();
  const c = correct.toLowerCase();
  if (a === c) return true;
  const cWords = new Set(c.replace(/[()\/]/g, ' ').split(/\s+/).filter(Boolean));
  const aWords = new Set(a.split(/\s+/).filter(Boolean));
  const overlap = [...cWords].filter(w => aWords.has(w)).length;
  return overlap >= Math.max(1, Math.floor(cWords.size / 2));
}
