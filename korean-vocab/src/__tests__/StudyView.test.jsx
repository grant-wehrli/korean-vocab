import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StudyView from '../components/StudyView';

// Supabase mock — needed because StudyView renders ReportModal which imports supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
  },
}));

const word1 = { kr: '안녕', rom: 'annyeong', en: 'hello' };
const word2 = { kr: '감사', rom: 'gamsa', en: 'thanks' };
const word3 = { kr: '사랑', rom: 'sarang', en: 'love' };
const word4 = { kr: '학교', rom: 'hakgyo', en: 'school' };
const word5 = { kr: '친구', rom: 'chingu', en: 'friend' };

function makeStore(cards = {}) {
  return {
    cards,
    reviewCard: vi.fn(),
    forceAllDue: vi.fn(),
  };
}

function makeConfig(words, mode = 'recall', forceAll = false) {
  return { words, mode, forceAll };
}

describe('StudyView', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('RecallQuiz mode', () => {
    it('renders the Korean word and romanization', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByText('안녕')).toBeInTheDocument();
      expect(screen.getByText('annyeong')).toBeInTheDocument();
    });

    it('shows input field and Check button', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByPlaceholderText(/english meaning/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /check/i })).toBeInTheDocument();
    });

    it('Check button is disabled when input is empty', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByRole('button', { name: /check/i })).toBeDisabled();
    });

    it('shows correct feedback for right answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'hello' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('shows incorrect feedback for wrong answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it('submits on Enter key press', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      const input = screen.getByPlaceholderText(/english meaning/i);
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('auto-advances and calls store.reviewCard(quality=4) after correct answer', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'hello' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 4, expect.objectContaining({ kr: '안녕' }));
    });

    it('auto-advances and calls store.reviewCard(quality=1) after wrong answer', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 1, expect.objectContaining({ kr: '안녕' }));
    });

    it('shows completion screen after last card', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'hello' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    it('Peek button is visible during input phase', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByRole('button', { name: /peek/i })).toBeInTheDocument();
    });

    it('clicking Peek reveals the answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.click(screen.getByRole('button', { name: /peek/i }));
      expect(screen.getByText(/answer:/i)).toBeInTheDocument();
    });

    it('clicking Peek calls store.reviewCard with quality=1 after timer', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.click(screen.getByRole('button', { name: /peek/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 1, expect.objectContaining({ kr: '안녕' }));
    });

    it('completion screen calls onDone', async () => {
      const onDone = vi.fn();
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={onDone} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'hello' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      await act(async () => { vi.runAllTimers(); });
      fireEvent.click(screen.getByRole('button', { name: /done/i }));
      expect(onDone).toHaveBeenCalledOnce();
    });
  });

  describe('MCQ mode — empty-pill regression', () => {
    // Cards stored without `en` (e.g. reviewed before being initCards'd) used to
    // produce empty MCQ choice pills. Verify the guard filters them out.
    it('MCQ pills are never empty even when store has cards without en', () => {
      const badCards = {
        // 4 cards so the ">= 4" path is taken — but two are missing `en`
        '안녕': { kr: '안녕', rom: 'annyeong', ef: 2.5, n: 1, interval: 1, nextReview: '2026-01-01' },
        '감사': { kr: '감사', rom: 'gamsa', ef: 2.5, n: 1, interval: 1, nextReview: '2026-01-01' },
        '사랑': { kr: '사랑', rom: 'sarang', en: 'love', ef: 2.5, n: 1, interval: 1, nextReview: '2026-01-01' },
        '학교': { kr: '학교', rom: 'hakgyo', en: 'school', ef: 2.5, n: 1, interval: 1, nextReview: '2026-01-01' },
      };
      const manyWords = [word1, word2, word3, word4, word5];
      render(
        <StudyView
          config={makeConfig(manyWords, 'mcq')}
          store={makeStore(badCards)}
          allSets={{}}
          onDone={vi.fn()}
        />
      );
      // All rendered choice buttons should have non-empty text
      const choiceButtons = screen.getAllByRole('button').filter(
        b => !b.textContent.includes('✕') && !b.textContent.includes('♪')
      );
      choiceButtons.forEach(btn => {
        expect(btn.textContent.trim()).not.toBe('');
      });
    });
  });

  describe('MCQ mode', () => {
    const manyWords = [word1, word2, word3, word4, word5];

    it('renders multiple choice buttons', () => {
      render(
        <StudyView config={makeConfig(manyWords, 'mcq')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });

    it('shows a Korean word prompt', () => {
      render(
        <StudyView config={makeConfig(manyWords, 'mcq')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      const hasKorean = manyWords.some(w => screen.queryByText(w.kr));
      expect(hasKorean).toBe(true);
    });

    it('clicking a choice calls store.reviewCard after the 700ms delay', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig(manyWords, 'mcq')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      const choiceButtons = screen.getAllByRole('button').filter(b => !b.textContent.includes('✕') && !b.textContent.includes('♪'));
      fireEvent.click(choiceButtons[0]);
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).toHaveBeenCalled();
    });
  });

  describe('Reverse mode', () => {
    it('renders the English word as the prompt', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByText('hello')).toBeInTheDocument();
    });

    it('shows input for Korean/romanization', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByPlaceholderText(/한국어 or romanization/i)).toBeInTheDocument();
    });

    it('correct romanization shows correct phase', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'annyeong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('correct Korean script shows correct phase', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: '안녕' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('wrong answer shows incorrect phase', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it('Peek button is visible during input phase', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByRole('button', { name: /peek/i })).toBeInTheDocument();
    });

    it('clicking Peek reveals the Korean answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.click(screen.getByRole('button', { name: /peek/i }));
      expect(screen.getByText('안녕')).toBeInTheDocument();
    });

    it('auto-advances after correct reverse answer', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'annyeong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 4, expect.objectContaining({ kr: '안녕' }));
    });
  });

  describe('RecallQuiz — Report button', () => {
    it('shows "Report issue" button after a wrong answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument();
    });

    it('does NOT show "Report issue" after a correct answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'hello' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.queryByRole('button', { name: /report issue/i })).not.toBeInTheDocument();
    });

    it('clicking Report opens the modal with card info', () => {
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      fireEvent.click(screen.getByRole('button', { name: /report issue/i }));
      expect(screen.getByText(/report an issue/i)).toBeInTheDocument();
      // "Current answer:" label only appears inside the modal
      expect(screen.getByText(/current answer/i)).toBeInTheDocument();
    });

    it('auto-advance is paused while the report modal is open', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      fireEvent.click(screen.getByRole('button', { name: /report issue/i }));
      // Run all timers — should NOT advance because modal is open
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).not.toHaveBeenCalled();
    });

    it('closing modal via Cancel advances the card', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      fireEvent.click(screen.getByRole('button', { name: /report issue/i }));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 1, expect.objectContaining({ kr: '안녕' }));
    });
  });

  describe('RecallQuiz — alt answers', () => {
    const wordWithAlt = { kr: '죄송합니다', rom: 'joesonghamnida', en: 'sorry', alt: ["i'm sorry", 'i apologize'] };

    it('accepts a primary answer', () => {
      render(
        <StudyView config={makeConfig([wordWithAlt], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'sorry' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('accepts an alt answer', () => {
      render(
        <StudyView config={makeConfig([wordWithAlt], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: "i'm sorry" } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('rejects an answer not in en or alt', () => {
      render(
        <StudyView config={makeConfig([wordWithAlt], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'banana' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });
  });

  describe('ReverseQuiz — Report button', () => {
    it('shows "Report issue" after a wrong answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument();
    });

    it('does NOT show "Report issue" after a correct answer', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'annyeong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.queryByRole('button', { name: /report issue/i })).not.toBeInTheDocument();
    });

    it('clicking Report opens the modal', () => {
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      fireEvent.click(screen.getByRole('button', { name: /report issue/i }));
      expect(screen.getByText(/report an issue/i)).toBeInTheDocument();
    });

    it('auto-advance is paused while the report modal is open', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'reverse')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      fireEvent.click(screen.getByRole('button', { name: /report issue/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).not.toHaveBeenCalled();
    });
  });

  describe('ReverseQuiz — yo-ending tolerance', () => {
    const yoCard = { kr: '괜찮아요', rom: 'gwaenchanayo', en: "it's okay" };

    it('accepts romanization without trailing yo', () => {
      render(
        <StudyView config={makeConfig([yoCard], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: 'gwaenchana' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('accepts Korean without trailing 요', () => {
      render(
        <StudyView config={makeConfig([yoCard], 'reverse')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/한국어 or romanization/i), { target: { value: '괜찮아' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });
  });

  describe('progress and navigation', () => {
    it('shows card counter (1/N)', () => {
      render(
        <StudyView config={makeConfig([word1, word2], 'recall')} store={makeStore()} allSets={{}} onDone={vi.fn()} />
      );
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('exit button calls onDone', () => {
      const onDone = vi.fn();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={makeStore()} allSets={{}} onDone={onDone} />
      );
      fireEvent.click(screen.getByRole('button', { name: /✕/i }));
      expect(onDone).toHaveBeenCalledOnce();
    });

    it('calls forceAllDue when forceAll=true', () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall', true)} store={store} allSets={{}} onDone={vi.fn()} />
      );
      expect(store.forceAllDue).toHaveBeenCalledWith([word1]);
    });
  });
});
