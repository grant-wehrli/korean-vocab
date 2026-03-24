import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StudyView from '../components/StudyView';

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
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 4);
    });

    it('auto-advances and calls store.reviewCard(quality=1) after wrong answer', async () => {
      const store = makeStore();
      render(
        <StudyView config={makeConfig([word1], 'recall')} store={store} allSets={{}} onDone={vi.fn()} />
      );
      fireEvent.change(screen.getByPlaceholderText(/english meaning/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: /check/i }));
      await act(async () => { vi.runAllTimers(); });
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 1);
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
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 1);
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
      const choiceButtons = screen.getAllByRole('button').filter(b => !b.textContent.includes('✕'));
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
      expect(store.reviewCard).toHaveBeenCalledWith('안녕', 4);
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
