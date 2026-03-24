import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { todayISO, sm2Next } from './sm2';

describe('todayISO', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches today\'s date', () => {
    const expected = new Date().toISOString().split('T')[0];
    expect(todayISO()).toBe(expected);
  });
});

describe('sm2Next', () => {
  const baseCard = { kr: '안녕', rom: 'annyeong', en: 'hello', ef: 2.5, n: 0, interval: 1 };

  describe('correct answers (quality >= 3)', () => {
    it('quality 5: n=0 → interval stays 1, n becomes 1, ef increases', () => {
      const result = sm2Next(baseCard, 5);
      expect(result.n).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.ef).toBeGreaterThan(2.5);
    });

    it('quality 4: n=0 → interval=1, n=1', () => {
      const result = sm2Next(baseCard, 4);
      expect(result.n).toBe(1);
      expect(result.interval).toBe(1);
    });

    it('quality 3: n=0 → minimum correct, n=1, ef slightly decreases but stays above 1.3', () => {
      const result = sm2Next(baseCard, 3);
      expect(result.n).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.ef).toBeGreaterThanOrEqual(1.3);
    });

    it('n=1 → interval becomes 6', () => {
      const card = { ...baseCard, n: 1 };
      const result = sm2Next(card, 4);
      expect(result.interval).toBe(6);
      expect(result.n).toBe(2);
    });

    it('n=2 → interval = round(prev_interval * ef)', () => {
      const card = { ...baseCard, n: 2, interval: 6, ef: 2.5 };
      const result = sm2Next(card, 4);
      expect(result.interval).toBe(Math.round(6 * 2.5));
      expect(result.n).toBe(3);
    });
  });

  describe('incorrect answers (quality < 3)', () => {
    it('quality 2: n resets to 0, interval resets to 1', () => {
      const card = { ...baseCard, n: 5, interval: 20 };
      const result = sm2Next(card, 2);
      expect(result.n).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('quality 1: n and interval reset', () => {
      const card = { ...baseCard, n: 3, interval: 10 };
      const result = sm2Next(card, 1);
      expect(result.n).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('quality 0: n and interval reset', () => {
      const card = { ...baseCard, n: 8, interval: 50 };
      const result = sm2Next(card, 0);
      expect(result.n).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('ease factor (ef) behaviour', () => {
    it('ef is floored at 1.3', () => {
      // Repeatedly answer with quality 0 — ef should not drop below 1.3
      let card = { ...baseCard, ef: 1.3 };
      card = sm2Next(card, 0);
      expect(card.ef).toBe(1.3);
    });

    it('ef is rounded to 2 decimal places', () => {
      const result = sm2Next(baseCard, 3);
      const decimals = (result.ef.toString().split('.')[1] || '').length;
      expect(decimals).toBeLessThanOrEqual(2);
    });

    it('ef increases with quality 5', () => {
      const result = sm2Next(baseCard, 5);
      expect(result.ef).toBeGreaterThan(baseCard.ef);
    });

    it('ef decreases with quality 3', () => {
      const result = sm2Next(baseCard, 3);
      expect(result.ef).toBeLessThan(baseCard.ef);
    });
  });

  describe('nextReview', () => {
    it('is set to tomorrow for a new card answered correctly', () => {
      const result = sm2Next(baseCard, 5);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      expect(result.nextReview).toBe(tomorrow);
    });

    it('nextReview is 6 days out after second correct review', () => {
      const card = { ...baseCard, n: 1 };
      const result = sm2Next(card, 4);
      const sixDays = new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0];
      expect(result.nextReview).toBe(sixDays);
    });
  });

  it('preserves all other card properties', () => {
    const result = sm2Next(baseCard, 4);
    expect(result.kr).toBe(baseCard.kr);
    expect(result.rom).toBe(baseCard.rom);
    expect(result.en).toBe(baseCard.en);
  });

  it('uses default ef=2.5, n=0, interval=1 when card has no SRS fields', () => {
    const bare = { kr: '안녕', rom: 'annyeong', en: 'hello' };
    const result = sm2Next(bare, 4);
    expect(result.n).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.ef).toBeDefined();
  });
});
