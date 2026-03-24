export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function sm2Next(card, quality) {
  let { ef = 2.5, n = 0, interval = 1 } = card;

  if (quality >= 3) {
    if (n === 0) interval = 1;
    else if (n === 1) interval = 6;
    else interval = Math.round(interval * ef);
    n += 1;
  } else {
    n = 0;
    interval = 1;
  }

  ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const nextReview = new Date(Date.now() + interval * 86400000).toISOString().split('T')[0];

  return { ...card, ef: Math.round(ef * 100) / 100, n, interval, nextReview };
}
