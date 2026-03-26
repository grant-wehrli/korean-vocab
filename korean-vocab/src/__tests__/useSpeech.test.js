import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSpeech } from '../hooks/useSpeech';

describe('useSpeech', () => {
  let mockSpeak;
  let mockCancel;

  beforeEach(() => {
    mockSpeak = vi.fn();
    mockCancel = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak: mockSpeak, cancel: mockCancel },
      writable: true,
      configurable: true,
    });
    // SpeechSynthesisUtterance is not in jsdom — provide a minimal stub
    global.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ''; }
    };
  });

  it('calls speechSynthesis.speak with a ko-KR utterance', () => {
    const { result } = renderHook(() => useSpeech());
    result.current.speak('안녕하세요');
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalledWith(
      expect.objectContaining({ lang: 'ko-KR', text: '안녕하세요' })
    );
  });

  it('does not throw when speechSynthesis is unavailable', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useSpeech());
    expect(() => result.current.speak('hello')).not.toThrow();
  });
});
