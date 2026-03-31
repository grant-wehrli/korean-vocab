import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ReportModal from '../components/ReportModal';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
  },
}));

import { supabase } from '../lib/supabase';

const card = { kr: '괜찮아요', rom: 'gwaenchanayo', en: "it's okay" };

function renderModal(overrides = {}) {
  const props = {
    card,
    userAnswer: 'its ok',
    quizMode: 'recall',
    onClose: vi.fn(),
    ...overrides,
  };
  render(<ReportModal {...props} />);
  return props;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset supabase.from to return a fresh mockInsert each test
  supabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  localStorage.clear();
});

describe('ReportModal — rendering', () => {
  it('displays the card Korean characters', () => {
    renderModal();
    expect(screen.getByText('괜찮아요')).toBeInTheDocument();
  });

  it('displays the card romanization', () => {
    renderModal();
    expect(screen.getByText('gwaenchanayo')).toBeInTheDocument();
  });

  it('displays the current English answer', () => {
    renderModal();
    expect(screen.getByText(/current answer/i)).toBeInTheDocument();
    expect(screen.getByText("it's okay")).toBeInTheDocument();
  });

  it('displays what the user typed', () => {
    renderModal({ userAnswer: 'its ok' });
    expect(screen.getByText('its ok')).toBeInTheDocument();
  });

  it('pre-fills the suggested fix field with the user answer', () => {
    renderModal({ userAnswer: 'its ok' });
    expect(screen.getByDisplayValue('its ok')).toBeInTheDocument();
  });

  it('notes field starts empty', () => {
    renderModal();
    const textareas = screen.getAllByRole('textbox');
    const notes = textareas.find(el => el.tagName === 'TEXTAREA');
    expect(notes.value).toBe('');
  });

  it('shows Submit and Cancel buttons', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows title "Report an issue"', () => {
    renderModal();
    expect(screen.getByText(/report an issue/i)).toBeInTheDocument();
  });

  it('does not show "You typed" row when userAnswer is empty', () => {
    renderModal({ userAnswer: '' });
    expect(screen.queryByText(/you typed/i)).not.toBeInTheDocument();
  });
});

describe('ReportModal — Cancel / close', () => {
  it('Cancel button calls onClose immediately', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('clicking the ✕ icon calls onClose', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /✕/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('clicking the overlay backdrop calls onClose', () => {
    const { onClose } = renderModal();
    // The overlay is the outermost div; clicking it (but not the modal) should close
    const overlay = screen.getByText(/report an issue/i).closest('[style*="position: fixed"]');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('ReportModal — submission', () => {
  it('calls supabase.from("reports").insert with correct payload', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    renderModal({ userAnswer: 'its ok', quizMode: 'recall' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });

    expect(supabase.from).toHaveBeenCalledWith('reports');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        card_kr: '괜찮아요',
        card_rom: 'gwaenchanayo',
        card_en: "it's okay",
        user_answer: 'its ok',
        quiz_mode: 'recall',
      })
    );
  });

  it('includes suggested_fix from the text field', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    renderModal({ userAnswer: 'its ok' });
    fireEvent.change(screen.getByDisplayValue('its ok'), { target: { value: "it's ok" } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ suggested_fix: "it's ok" })
    );
  });

  it('includes notes when filled in', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    renderModal();
    fireEvent.change(screen.getByPlaceholderText(/any extra context/i), { target: { value: 'should accept ok too' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'should accept ok too' })
    );
  });

  it('sets user_id from session when authenticated', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-abc' } } },
    });

    renderModal();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-abc' })
    );
  });

  it('sets user_id to null when not authenticated', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    renderModal();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    );
  });

  it('shows "Sending…" while the request is in flight', async () => {
    let resolve;
    const mockInsert = vi.fn().mockReturnValue(new Promise(r => { resolve = r; }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();

    await act(async () => { resolve({ error: null }); });
  });

  it('shows "✓ Sent" after successful submission', async () => {
    vi.useFakeTimers();
    supabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

    renderModal();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });
    expect(screen.getByRole('button', { name: /sent/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('calls onClose after 800ms on success', async () => {
    vi.useFakeTimers();
    supabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });
    const { onClose } = renderModal();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});

describe('ReportModal — Supabase error fallback', () => {
  it('saves report to localStorage when insert fails', async () => {
    supabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('network error') }),
    });

    renderModal({ userAnswer: 'its ok', quizMode: 'recall' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });

    const stored = JSON.parse(localStorage.getItem('korean_vocab_reports') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      card_kr: '괜찮아요',
      user_answer: 'its ok',
      quiz_mode: 'recall',
    });
  });

  it('shows "Saved locally" on insert error', async () => {
    vi.useFakeTimers();
    supabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('network error') }),
    });

    renderModal();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });
    expect(screen.getByRole('button', { name: /saved locally/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('calls onClose after 1500ms on error', async () => {
    vi.useFakeTimers();
    supabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('fail') }),
    });
    const { onClose } = renderModal();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });
    await act(async () => { vi.advanceTimersByTime(1499); });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('appends to existing localStorage reports rather than overwriting', async () => {
    localStorage.setItem('korean_vocab_reports', JSON.stringify([{ card_kr: 'existing' }]));
    supabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('fail') }),
    });

    renderModal();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    });

    const stored = JSON.parse(localStorage.getItem('korean_vocab_reports'));
    expect(stored).toHaveLength(2);
    expect(stored[0].card_kr).toBe('existing');
  });
});

describe('ReportModal — disabled state during submission', () => {
  it('disables the suggested fix input while sending', async () => {
    let resolve;
    supabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue(new Promise(r => { resolve = r; })),
    });

    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => expect(input).toBeDisabled());

    await act(async () => { resolve({ error: null }); });
  });

  it('disables the Submit button while sending', async () => {
    let resolve;
    supabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue(new Promise(r => { resolve = r; })),
    });

    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();

    await act(async () => { resolve({ error: null }); });
  });
});
