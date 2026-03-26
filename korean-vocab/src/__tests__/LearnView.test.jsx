import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LearnView from '../components/LearnView';

const word1 = { kr: '안녕', rom: 'annyeong', en: 'hello' };
const word2 = { kr: '감사', rom: 'gamsa', en: 'thanks' };
const word3 = { kr: '사랑', rom: 'sarang', en: 'love' };

beforeEach(() => {
  const mockSpeak = vi.fn();
  const mockCancel = vi.fn();
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: mockSpeak, cancel: mockCancel },
    writable: true,
    configurable: true,
  });
  global.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; this.lang = ''; }
  };
});

describe('LearnView', () => {
  it('renders the first card Korean text', () => {
    render(<LearnView words={[word1, word2]} onDone={vi.fn()} />);
    expect(screen.getByText('안녕')).toBeInTheDocument();
  });

  it('renders romanization and English meaning', () => {
    render(<LearnView words={[word1, word2]} onDone={vi.fn()} />);
    expect(screen.getByText('annyeong')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('shows progress indicator 1/N', () => {
    render(<LearnView words={[word1, word2, word3]} onDone={vi.fn()} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('Next button advances to next card', () => {
    render(<LearnView words={[word1, word2]} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('감사')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('Back button goes to previous card', () => {
    render(<LearnView words={[word1, word2]} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('안녕')).toBeInTheDocument();
  });

  it('Back button is disabled on first card', () => {
    render(<LearnView words={[word1, word2]} onDone={vi.fn()} />);
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('clicking Pronounce button calls speechSynthesis.speak', () => {
    render(<LearnView words={[word1]} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pronounce/i }));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('shows Done screen after last card', () => {
    render(<LearnView words={[word1]} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(screen.getByText(/you've seen all 1 words/i)).toBeInTheDocument();
  });

  it('"Study now" calls onDone with studyNow: true', () => {
    const onDone = vi.fn();
    render(<LearnView words={[word1]} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    fireEvent.click(screen.getByRole('button', { name: /study now/i }));
    expect(onDone).toHaveBeenCalledWith({ studyNow: true });
  });

  it('"Back to Home" calls onDone with studyNow: false', () => {
    const onDone = vi.fn();
    render(<LearnView words={[word1]} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(onDone).toHaveBeenCalledWith({ studyNow: false });
  });

  it('exit ✕ button calls onDone with studyNow: false', () => {
    const onDone = vi.fn();
    render(<LearnView words={[word1, word2]} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: /exit/i }));
    expect(onDone).toHaveBeenCalledWith({ studyNow: false });
  });
});
