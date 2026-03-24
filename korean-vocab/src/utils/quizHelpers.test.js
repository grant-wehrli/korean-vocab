import { describe, it, expect } from 'vitest';
import { shuffle, buildQueue, flexMatch } from './quizHelpers';

describe('shuffle', () => {
  it('returns an array with the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(arr.length);
    expect(result.sort()).toEqual([...arr].sort());
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('returns a new array reference', () => {
    const arr = [1, 2, 3];
    expect(shuffle(arr)).not.toBe(arr);
  });

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(shuffle(['a'])).toEqual(['a']);
  });
});

describe('flexMatch', () => {
  it('exact match returns true', () => {
    expect(flexMatch('hello', 'hello')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(flexMatch('Hello', 'hello')).toBe(true);
    expect(flexMatch('HELLO', 'hello')).toBe(true);
  });

  it('trims whitespace from answer', () => {
    expect(flexMatch('  hello  ', 'hello')).toBe(true);
  });

  it('single-word correct answer requires exact word match', () => {
    expect(flexMatch('hello', 'hello (formal)')).toBe(true);
  });

  it('partial overlap meets threshold (≥50% of correct words)', () => {
    // "hello formal" → 2 words, need ≥1 (floor(2/2)=1), answer has "hello" → overlap=1 → true
    expect(flexMatch('hello', 'hello formal')).toBe(true);
  });

  it('insufficient overlap returns false', () => {
    // "to go somewhere far" → meaningful words: {go, somewhere, far}, threshold=1
    // "to" is a stop word → meaningful overlap = 0 → false
    expect(flexMatch('to', 'to go somewhere far')).toBe(false);
  });

  it('no match returns false', () => {
    expect(flexMatch('goodbye', 'hello')).toBe(false);
  });

  it('strips parentheses and slashes from correct answer before matching', () => {
    // "hello (formal)" after stripping → "hello  formal" → words: {hello, formal}
    expect(flexMatch('formal', 'hello (formal)')).toBe(true);
  });

  it('handles slash-separated alternatives', () => {
    // "go/come" → after replace → "go come" → words: {go, come}
    expect(flexMatch('go', 'go/come')).toBe(true);
  });

  it('multi-word answer with sufficient overlap', () => {
    expect(flexMatch('hello formal', 'hello formal greeting')).toBe(true);
  });

  // Stop-word / real vocab cases
  it('"nice" matches "nice to meet you" (stop words excluded from threshold)', () => {
    expect(flexMatch('nice', 'nice to meet you')).toBe(true);
  });

  it('"meet" matches "nice to meet you"', () => {
    expect(flexMatch('meet', 'nice to meet you')).toBe(true);
  });

  it('"okay" matches "it\'s okay" (apostrophe stripped, stop word filtered)', () => {
    expect(flexMatch('okay', "it's okay")).toBe(true);
  });

  it('"how are you" matches "how are you? (formal)" (question mark stripped)', () => {
    expect(flexMatch('how are you', 'how are you? (formal)')).toBe(true);
  });

  it('"sorry" matches "I\'m sorry (formal)"', () => {
    expect(flexMatch('sorry', "I'm sorry (formal)")).toBe(true);
  });

  it('"eat" matches "to eat" (regression — stop word "to" excluded)', () => {
    expect(flexMatch('eat', 'to eat')).toBe(true);
  });

  it('nonsense answer still fails', () => {
    expect(flexMatch('banana', 'nice to meet you')).toBe(false);
  });

  // Digit normalization
  it('"5" matches "five (native)"', () => {
    expect(flexMatch('5', 'five (native)')).toBe(true);
  });

  it('"1" matches "one (native)"', () => {
    expect(flexMatch('1', 'one (native)')).toBe(true);
  });

  it('"10" matches "ten"', () => {
    expect(flexMatch('10', 'ten')).toBe(true);
  });

  it('"100" matches "hundred"', () => {
    expect(flexMatch('100', 'hundred')).toBe(true);
  });

  it('"20" matches "twenty"', () => {
    expect(flexMatch('20', 'twenty')).toBe(true);
  });

  it('unknown digit falls through to no-match', () => {
    expect(flexMatch('99', 'hello')).toBe(false);
  });
});

describe('buildQueue', () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const words = [
    { kr: '안녕', rom: 'annyeong', en: 'hello' },
    { kr: '감사', rom: 'gamsa', en: 'thanks' },
    { kr: '사랑', rom: 'sarang', en: 'love' },
  ];

  it('forceAll=true returns all words', () => {
    const store = { cards: {} };
    const result = buildQueue(words, store, true);
    expect(result).toHaveLength(3);
  });

  it('forceAll=false includes unseen cards (no card in store)', () => {
    const store = { cards: {} };
    const result = buildQueue(words, store, false);
    expect(result).toHaveLength(3);
  });

  it('forceAll=false excludes cards with future nextReview', () => {
    const store = {
      cards: {
        '안녕': { nextReview: tomorrow },
      },
    };
    const result = buildQueue(words, store, false);
    expect(result).toHaveLength(2);
    expect(result.find(w => w.kr === '안녕')).toBeUndefined();
  });

  it('forceAll=false includes cards due today', () => {
    const store = {
      cards: {
        '안녕': { nextReview: today },
      },
    };
    const result = buildQueue(words, store, false);
    expect(result.find(w => w.kr === '안녕')).toBeDefined();
  });

  it('forceAll=false includes overdue cards', () => {
    const store = {
      cards: {
        '안녕': { nextReview: yesterday },
      },
    };
    const result = buildQueue(words, store, false);
    expect(result.find(w => w.kr === '안녕')).toBeDefined();
  });

  it('returns a shuffled (new) array, not the original', () => {
    const store = { cards: {} };
    const result = buildQueue(words, store, true);
    expect(result).not.toBe(words);
  });

  it('returns empty array when no words are due', () => {
    const store = {
      cards: {
        '안녕': { nextReview: tomorrow },
        '감사': { nextReview: tomorrow },
        '사랑': { nextReview: tomorrow },
      },
    };
    const result = buildQueue(words, store, false);
    expect(result).toHaveLength(0);
  });
});
