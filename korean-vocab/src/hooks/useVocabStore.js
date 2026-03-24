import { useState, useCallback } from 'react';

const STORAGE_KEY = 'korean_vocab_v1';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function sm2Next(card, quality) {
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { cards: {}, customSets: {} };
  } catch {
    return { cards: {}, customSets: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useVocabStore() {
  const [state, setState] = useState(() => loadState());

  const update = useCallback((updater) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const getCard = useCallback((word) => {
    const card = state.cards[word.kr];
    if (card) return card;
    return {
      kr: word.kr, rom: word.rom, en: word.en,
      ef: 2.5, n: 0, interval: 1,
      nextReview: todayISO(),
    };
  }, [state.cards]);

  const initCards = useCallback((words) => {
    update(prev => {
      const cards = { ...prev.cards };
      words.forEach(w => {
        if (!cards[w.kr]) {
          cards[w.kr] = {
            kr: w.kr, rom: w.rom, en: w.en,
            ef: 2.5, n: 0, interval: 1,
            nextReview: todayISO(),
          };
        }
      });
      return { ...prev, cards };
    });
  }, [update]);

  const reviewCard = useCallback((kr, quality) => {
    update(prev => {
      const card = prev.cards[kr] || {};
      return {
        ...prev,
        cards: { ...prev.cards, [kr]: sm2Next(card, quality) },
      };
    });
  }, [update]);

  const forceAllDue = useCallback((words) => {
    const today = todayISO();
    update(prev => {
      const cards = { ...prev.cards };
      words.forEach(w => {
        if (cards[w.kr]) cards[w.kr] = { ...cards[w.kr], nextReview: today };
        else cards[w.kr] = { kr: w.kr, rom: w.rom, en: w.en, ef: 2.5, n: 0, interval: 1, nextReview: today };
      });
      return { ...prev, cards };
    });
  }, [update]);

  const importSet = useCallback((name, words) => {
    update(prev => ({
      ...prev,
      customSets: { ...prev.customSets, [name]: words },
    }));
  }, [update]);

  const deleteCustomSet = useCallback((name) => {
    update(prev => {
      const customSets = { ...prev.customSets };
      delete customSets[name];
      return { ...prev, customSets };
    });
  }, [update]);

  const getDueCards = useCallback((words) => {
    const today = todayISO();
    return words.filter(w => {
      const card = state.cards[w.kr];
      return !card || card.nextReview <= today;
    });
  }, [state.cards]);

  const getStats = useCallback(() => {
    const cards = Object.values(state.cards);
    const today = todayISO();
    return {
      total: cards.length,
      due: cards.filter(c => c.nextReview <= today).length,
      mature: cards.filter(c => c.interval >= 21).length,
      young: cards.filter(c => c.interval > 1 && c.interval < 21).length,
      hardest: [...cards].sort((a, b) => a.ef - b.ef).slice(0, 5),
    };
  }, [state.cards]);

  return {
    cards: state.cards,
    customSets: state.customSets,
    getCard,
    initCards,
    reviewCard,
    forceAllDue,
    importSet,
    deleteCustomSet,
    getDueCards,
    getStats,
  };
}
