import { useState, useCallback } from 'react';
import { todayISO, sm2Next } from '../utils/sm2';
import { supabase } from '../lib/supabase';

const GUEST_KEY = 'korean_vocab_v1';

function storageKey(userId) {
  return userId ? `korean_vocab_v1_${userId}` : GUEST_KEY;
}

function loadState(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      cards: parsed.cards ?? {},
      customSets: parsed.customSets ?? {},
      streak: parsed.streak ?? 0,
      last_studied: parsed.last_studied ?? null,
    };
  } catch {
    return { cards: {}, customSets: {}, streak: 0, last_studied: null };
  }
}

function saveState(state, userId) {
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

// Fire-and-forget Supabase sync helpers
function syncCard(userId, card) {
  if (!userId) return;
  supabase.from('cards').upsert({
    user_id: userId,
    kr: card.kr,
    rom: card.rom,
    en: card.en,
    ef: card.ef,
    n: card.n,
    interval: card.interval,
    next_review: card.nextReview,
    updated_at: new Date().toISOString(),
  }).then(({ error }) => { if (error) console.error('syncCard', error); });
}

function syncCustomSet(userId, name, words) {
  if (!userId) return;
  supabase.from('custom_sets').upsert({
    user_id: userId,
    name,
    words,
    updated_at: new Date().toISOString(),
  }).then(({ error }) => { if (error) console.error('syncCustomSet', error); });
}

function deleteCustomSetRemote(userId, name) {
  if (!userId) return;
  supabase.from('custom_sets').delete()
    .eq('user_id', userId).eq('name', name)
    .then(({ error }) => { if (error) console.error('deleteCustomSet', error); });
}

// Load all Supabase data into localStorage and return the merged state
export async function loadFromSupabase(userId) {
  const [cardsRes, setsRes, prefsRes] = await Promise.all([
    supabase.from('cards').select('*').eq('user_id', userId),
    supabase.from('custom_sets').select('*').eq('user_id', userId),
    supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const cards = {};
  (cardsRes.data ?? []).forEach(row => {
    cards[row.kr] = {
      kr: row.kr, rom: row.rom, en: row.en,
      ef: parseFloat(row.ef), n: row.n, interval: row.interval,
      nextReview: row.next_review,
    };
  });

  const customSets = {};
  (setsRes.data ?? []).forEach(row => { customSets[row.name] = row.words; });

  const defaultMode = prefsRes.data?.default_mode ?? 'recall';
  const streak = prefsRes.data?.streak ?? 0;
  const last_studied = prefsRes.data?.last_studied ?? null;

  const state = { cards, customSets, streak, last_studied };
  saveState(state, userId);
  return { ...state, defaultMode };
}

// Push local guest data to Supabase after sign-in migration
export async function migrateGuestData(userId) {
  const raw = localStorage.getItem(GUEST_KEY);
  if (!raw) return;
  const { cards, customSets } = JSON.parse(raw);
  const cardRows = Object.values(cards).map(c => ({
    user_id: userId,
    kr: c.kr, rom: c.rom, en: c.en,
    ef: c.ef, n: c.n, interval: c.interval,
    next_review: c.nextReview,
    updated_at: new Date().toISOString(),
  }));
  const setRows = Object.entries(customSets).map(([name, words]) => ({
    user_id: userId, name, words, updated_at: new Date().toISOString(),
  }));
  if (cardRows.length) await supabase.from('cards').upsert(cardRows, { ignoreDuplicates: true });
  if (setRows.length) await supabase.from('custom_sets').upsert(setRows, { ignoreDuplicates: true });
}

export async function saveDefaultMode(userId, mode) {
  if (!userId) return;
  await supabase.from('user_preferences').upsert({
    user_id: userId,
    default_mode: mode,
    updated_at: new Date().toISOString(),
  });
}

export function useVocabStore(userId) {
  const [state, setState] = useState(() => loadState(userId));

  const update = useCallback((updater) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next, userId);
      return next;
    });
  }, [userId]);

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
          syncCard(userId, cards[w.kr]);
        }
      });
      return { ...prev, cards };
    });
  }, [update, userId]);

  const reviewCard = useCallback((kr, quality) => {
    update(prev => {
      const card = prev.cards[kr] || {};
      const next = sm2Next(card, quality);
      syncCard(userId, next);
      return {
        ...prev,
        cards: { ...prev.cards, [kr]: next },
      };
    });
  }, [update, userId]);

  const forceAllDue = useCallback((words) => {
    const today = todayISO();
    update(prev => {
      const cards = { ...prev.cards };
      words.forEach(w => {
        if (cards[w.kr]) cards[w.kr] = { ...cards[w.kr], nextReview: today };
        else cards[w.kr] = { kr: w.kr, rom: w.rom, en: w.en, ef: 2.5, n: 0, interval: 1, nextReview: today };
        syncCard(userId, cards[w.kr]);
      });
      return { ...prev, cards };
    });
  }, [update, userId]);

  const importSet = useCallback((name, words) => {
    update(prev => ({
      ...prev,
      customSets: { ...prev.customSets, [name]: words },
    }));
    syncCustomSet(userId, name, words);
  }, [update, userId]);

  const deleteCustomSet = useCallback((name) => {
    update(prev => {
      const customSets = { ...prev.customSets };
      delete customSets[name];
      return { ...prev, customSets };
    });
    deleteCustomSetRemote(userId, name);
  }, [update, userId]);

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

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setState(prev => {
      if (prev.last_studied === today) return prev;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = prev.last_studied === yesterday ? (prev.streak ?? 0) + 1 : 1;
      const next = { ...prev, streak: newStreak, last_studied: today };
      saveState(next, userId);
      if (userId) {
        supabase.from('user_preferences').upsert({
          user_id: userId, streak: newStreak, last_studied: today,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => { if (error) console.error('updateStreak', error); });
      }
      return next;
    });
  }, [userId]);

  // Replace in-memory state entirely (used after Supabase load)
  const replaceState = useCallback((newState) => {
    setState(newState);
    saveState(newState, userId);
  }, [userId]);

  return {
    cards: state.cards,
    customSets: state.customSets,
    streak: state.streak ?? 0,
    getCard,
    initCards,
    reviewCard,
    forceAllDue,
    importSet,
    deleteCustomSet,
    getDueCards,
    getStats,
    replaceState,
    updateStreak,
  };
}
