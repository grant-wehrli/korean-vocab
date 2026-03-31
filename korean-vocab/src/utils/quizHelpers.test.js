import { describe, it, expect } from 'vitest';
import { shuffle, buildQueue, flexMatch, romFlexMatch } from './quizHelpers';

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

  // alt (synonym) matching
  it('matches an alt when correct does not match', () => {
    expect(flexMatch('thanks', 'thank you', ['thanks', 'cheers'])).toBe(true);
  });

  it('still matches correct when alts are provided', () => {
    expect(flexMatch('thank you', 'thank you', ['thanks'])).toBe(true);
  });

  it('returns false when neither correct nor any alt matches', () => {
    expect(flexMatch('banana', 'thank you', ['thanks', 'cheers'])).toBe(false);
  });

  it('alt match is case-insensitive', () => {
    expect(flexMatch('THANKS', 'thank you', ['thanks'])).toBe(true);
  });

  it('"nice to meet you" matches alt for 잘 부탁드립니다', () => {
    const alts = ["nice to meet you", "i'm in your care", "i look forward to working with you"];
    expect(flexMatch('nice to meet you', 'please take care of me', alts)).toBe(true);
  });

  // Levenshtein fuzzy spelling tolerance
  it('"goodby" matches "goodbye" (1 edit distance)', () => {
    expect(flexMatch('goodby', 'goodbye')).toBe(true);
  });

  it('"welcom" matches "welcome" (1 edit distance)', () => {
    expect(flexMatch('welcom', 'welcome')).toBe(true);
  });

  it('"librery" matches "library" (1 edit distance)', () => {
    expect(flexMatch('librery', 'library')).toBe(true);
  });

  it('short 3-letter typo "cat" does not fuzzy-match "catch" (too short)', () => {
    expect(flexMatch('cat', 'catch')).toBe(false);
  });

  it('2-edit-distance typo does not match', () => {
    // "gobbbye" is 2 substitutions from "goodbye" (o→b, d→b)
    expect(flexMatch('gobbbye', 'goodbye')).toBe(false);
  });
});

describe('romFlexMatch', () => {
  const card = { kr: '괜찮아요', rom: 'gwaenchanayo', en: "it's okay" };

  it('exact Korean match returns true', () => {
    expect(romFlexMatch('괜찮아요', card)).toBe(true);
  });

  it('exact romanization match returns true', () => {
    expect(romFlexMatch('gwaenchanayo', card)).toBe(true);
  });

  it('romanization is case-insensitive', () => {
    expect(romFlexMatch('GWAENCHANAYO', card)).toBe(true);
  });

  it('Korean without trailing 요 returns true', () => {
    expect(romFlexMatch('괜찮아', card)).toBe(true);
  });

  it('romanization without trailing yo returns true', () => {
    expect(romFlexMatch('gwaenchana', card)).toBe(true);
  });

  it('wrong answer returns false', () => {
    expect(romFlexMatch('annyeong', card)).toBe(false);
  });

  it('completely wrong Korean returns false', () => {
    expect(romFlexMatch('안녕', card)).toBe(false);
  });

  it('card without 요 ending: only exact match accepted', () => {
    const card2 = { kr: '안녕', rom: 'annyeong', en: 'hi (casual)' };
    expect(romFlexMatch('annyeong', card2)).toBe(true);
    // "annyeon" should NOT match since the card does not end in "yo"
    expect(romFlexMatch('annyeon', card2)).toBe(false);
  });

  it('card ending in 요: stripped Korean also accepted', () => {
    const card3 = { kr: '감사해요', rom: 'gamsahaeyo', en: 'thank you (casual)' };
    expect(romFlexMatch('감사해', card3)).toBe(true);
    expect(romFlexMatch('gamsahae', card3)).toBe(true);
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
