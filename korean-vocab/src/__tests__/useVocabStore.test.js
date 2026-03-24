import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock supabase so createClient doesn't throw; sync calls are no-ops (userId is null in all tests)
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockReturnValue({ then: vi.fn() }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  },
}));

import { useVocabStore } from '../hooks/useVocabStore';

const word1 = { kr: '안녕하세요', rom: 'annyeonghaseyo', en: 'hello (formal)' };
const word2 = { kr: '감사합니다', rom: 'gamsahamnida', en: 'thank you' };
const word3 = { kr: '사랑해요', rom: 'saranghaeyo', en: 'I love you' };

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

describe('useVocabStore', () => {
  describe('initCards', () => {
    it('initializes unseen cards with default SRS values', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));

      const card = result.current.cards[word1.kr];
      expect(card).toBeDefined();
      expect(card.kr).toBe(word1.kr);
      expect(card.ef).toBe(2.5);
      expect(card.n).toBe(0);
      expect(card.interval).toBe(1);
      expect(card.nextReview).toBe(today);
    });

    it('does not overwrite an already-stored card', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      act(() => result.current.reviewCard(word1.kr, 5));
      const efAfterReview = result.current.cards[word1.kr].ef;

      act(() => result.current.initCards([word1]));
      expect(result.current.cards[word1.kr].ef).toBe(efAfterReview);
    });

    it('initializes multiple cards at once', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1, word2]));
      expect(result.current.cards[word1.kr]).toBeDefined();
      expect(result.current.cards[word2.kr]).toBeDefined();
    });
  });

  describe('reviewCard', () => {
    it('updates the card via SM-2 after a correct answer', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      act(() => result.current.reviewCard(word1.kr, 5));

      const card = result.current.cards[word1.kr];
      expect(card.n).toBe(1);
      expect(card.interval).toBe(1);
      expect(card.ef).toBeGreaterThan(2.5);
    });

    it('resets n and interval after an incorrect answer', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      act(() => result.current.reviewCard(word1.kr, 5)); // n=1
      act(() => result.current.reviewCard(word1.kr, 4)); // n=2, interval=6
      act(() => result.current.reviewCard(word1.kr, 0)); // incorrect

      const card = result.current.cards[word1.kr];
      expect(card.n).toBe(0);
      expect(card.interval).toBe(1);
    });

    it('creates a card from scratch if not yet in store', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.reviewCard(word1.kr, 4));
      expect(result.current.cards[word1.kr]).toBeDefined();
    });

    it('persists the updated card to localStorage', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      act(() => result.current.reviewCard(word1.kr, 4));

      const stored = JSON.parse(localStorage.getItem('korean_vocab_v1'));
      expect(stored.cards[word1.kr].n).toBe(1);
    });
  });

  describe('getCard', () => {
    it('returns default card shape for unseen word', () => {
      const { result } = renderHook(() => useVocabStore());
      const card = result.current.getCard(word1);
      expect(card.kr).toBe(word1.kr);
      expect(card.ef).toBe(2.5);
      expect(card.n).toBe(0);
    });

    it('returns stored card for a seen word', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      act(() => result.current.reviewCard(word1.kr, 5));

      const card = result.current.getCard(word1);
      expect(card.n).toBe(1);
    });
  });

  describe('getDueCards', () => {
    it('includes unseen words (no card in store)', () => {
      const { result } = renderHook(() => useVocabStore());
      const due = result.current.getDueCards([word1, word2]);
      expect(due).toHaveLength(2);
    });

    it('excludes words with future nextReview', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      // Manually push nextReview into the future by reviewing with quality 5 twice
      act(() => result.current.reviewCard(word1.kr, 5));
      act(() => result.current.reviewCard(word1.kr, 5)); // interval = 6 days out

      const due = result.current.getDueCards([word1, word2]);
      // word1 is not due (6 days out), word2 is due (unseen)
      expect(due.find(w => w.kr === word2.kr)).toBeDefined();
      expect(due.find(w => w.kr === word1.kr)).toBeUndefined();
    });

    it('includes cards due today', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1])); // nextReview = today
      const due = result.current.getDueCards([word1]);
      expect(due).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('returns zeros when no cards are stored', () => {
      const { result } = renderHook(() => useVocabStore());
      const stats = result.current.getStats();
      expect(stats.total).toBe(0);
      expect(stats.due).toBe(0);
      expect(stats.mature).toBe(0);
      expect(stats.young).toBe(0);
      expect(stats.hardest).toEqual([]);
    });

    it('counts total tracked cards', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1, word2, word3]));
      expect(result.current.getStats().total).toBe(3);
    });

    it('counts due cards (nextReview <= today)', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1, word2]));
      // Both are due today by default
      expect(result.current.getStats().due).toBe(2);
    });

    it('counts mature cards (interval >= 21)', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      // Drive up interval via multiple correct answers
      act(() => result.current.reviewCard(word1.kr, 5));
      act(() => result.current.reviewCard(word1.kr, 5));
      act(() => result.current.reviewCard(word1.kr, 5));
      act(() => result.current.reviewCard(word1.kr, 5));

      // interval after 4 correct: 1 → 6 → 15 → 37 (>21)
      const stats = result.current.getStats();
      expect(stats.mature).toBe(1);
    });

    it('counts young cards (1 < interval < 21)', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      act(() => result.current.reviewCard(word1.kr, 4)); // n=1, interval=1
      act(() => result.current.reviewCard(word1.kr, 4)); // n=2, interval=6

      expect(result.current.getStats().young).toBe(1);
    });

    it('hardest returns up to 5 cards sorted by ef ascending', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1, word2, word3]));
      act(() => result.current.reviewCard(word1.kr, 0)); // ef decreases
      act(() => result.current.reviewCard(word2.kr, 5)); // ef increases

      const { hardest } = result.current.getStats();
      expect(hardest.length).toBeGreaterThan(0);
      expect(hardest.length).toBeLessThanOrEqual(5);
      // First item should have lowest ef
      if (hardest.length > 1) {
        expect(hardest[0].ef).toBeLessThanOrEqual(hardest[1].ef);
      }
    });
  });

  describe('importSet / deleteCustomSet', () => {
    it('importSet adds words to customSets', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.importSet('My Set', [word1, word2]));
      expect(result.current.customSets['My Set']).toHaveLength(2);
    });

    it('deleteCustomSet removes the set', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.importSet('My Set', [word1]));
      act(() => result.current.deleteCustomSet('My Set'));
      expect(result.current.customSets['My Set']).toBeUndefined();
    });

    it('persists customSets to localStorage', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.importSet('My Set', [word1]));
      const stored = JSON.parse(localStorage.getItem('korean_vocab_v1'));
      expect(stored.customSets['My Set']).toHaveLength(1);
    });
  });

  describe('forceAllDue', () => {
    it('sets nextReview to today for existing cards', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.initCards([word1]));
      act(() => result.current.reviewCard(word1.kr, 5));
      act(() => result.current.reviewCard(word1.kr, 5)); // pushes nextReview out

      act(() => result.current.forceAllDue([word1]));
      expect(result.current.cards[word1.kr].nextReview).toBe(today);
    });

    it('creates a new card with today nextReview for unseen words', () => {
      const { result } = renderHook(() => useVocabStore());
      act(() => result.current.forceAllDue([word1]));
      expect(result.current.cards[word1.kr].nextReview).toBe(today);
    });
  });

  describe('localStorage error handling', () => {
    it('returns empty state if localStorage contains invalid JSON', () => {
      localStorage.setItem('korean_vocab_v1', 'not-json{{{');
      const { result } = renderHook(() => useVocabStore());
      expect(result.current.cards).toEqual({});
      expect(result.current.customSets).toEqual({});
    });
  });
});
