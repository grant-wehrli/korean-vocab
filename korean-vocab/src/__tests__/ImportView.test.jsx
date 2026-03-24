import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportView from '../components/ImportView';

function makeStore(customSets = {}) {
  return {
    customSets,
    importSet: vi.fn(),
    deleteCustomSet: vi.fn(),
  };
}

describe('ImportView', () => {
  it('renders the import heading', () => {
    render(<ImportView store={makeStore()} onBack={vi.fn()} />);
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('renders the drop zone', () => {
    render(<ImportView store={makeStore()} onBack={vi.fn()} />);
    expect(screen.getByText('Drop JSON file here')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<ImportView store={makeStore()} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows template download button', () => {
    render(<ImportView store={makeStore()} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
  });

  it('renders custom sets with word count', () => {
    const customSets = {
      'My Set': [
        { kr: '테스트', rom: 'teseuteu', en: 'test' },
        { kr: '공부', rom: 'gongbu', en: 'study' },
      ],
    };
    render(<ImportView store={makeStore(customSets)} onBack={vi.fn()} />);
    expect(screen.getByText('My Set')).toBeInTheDocument();
    expect(screen.getByText('2 words')).toBeInTheDocument();
  });

  it('calls deleteCustomSet when remove button is clicked', () => {
    const store = makeStore({ 'My Set': [{ kr: '테스트', rom: 'teseuteu', en: 'test' }] });
    render(<ImportView store={store} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(store.deleteCustomSet).toHaveBeenCalledWith('My Set');
  });

  it('shows success status after importing valid JSON object', async () => {
    const store = makeStore();
    render(<ImportView store={store} onBack={vi.fn()} />);

    const jsonContent = JSON.stringify({
      'Test Set': [{ kr: '테스트', rom: 'teseuteu', en: 'test' }],
    });
    const file = new File([jsonContent], 'vocab.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]');

    // Simulate FileReader onload manually
    const originalFileReader = global.FileReader;
    global.FileReader = class {
      readAsText() {
        setTimeout(() => {
          this.onload({ target: { result: jsonContent } });
        }, 0);
      }
    };

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/imported 1 word/i)).toBeInTheDocument();
    });

    global.FileReader = originalFileReader;
  });

  it('shows success status after importing valid JSON array', async () => {
    const store = makeStore();
    render(<ImportView store={store} onBack={vi.fn()} />);

    const jsonContent = JSON.stringify([{ kr: '테스트', rom: 'teseuteu', en: 'test' }]);
    const file = new File([jsonContent], 'vocab.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]');

    global.FileReader = class {
      readAsText() {
        setTimeout(() => {
          this.onload({ target: { result: jsonContent } });
        }, 0);
      }
    };

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/imported 1 word/i)).toBeInTheDocument();
    });
  });

  it('calls importSet and shows success when file is dropped', async () => {
    const store = makeStore();
    render(<ImportView store={store} onBack={vi.fn()} />);

    const jsonContent = JSON.stringify({ 'Dropped Set': [{ kr: '안녕', rom: 'annyeong', en: 'hello' }] });

    global.FileReader = class {
      readAsText() {
        setTimeout(() => { this.onload({ target: { result: jsonContent } }); }, 0);
      }
    };

    const dropZone = screen.getByText('Drop JSON file here').closest('div');
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [new File([jsonContent], 'vocab.json', { type: 'application/json' })] },
    });

    await waitFor(() => {
      expect(screen.getByText(/imported 1 word/i)).toBeInTheDocument();
    });
  });

  it('downloadTemplate creates and clicks a download anchor', () => {
    const revokeObjectURL = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    render(<ImportView store={makeStore()} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /download template/i }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('shows error status for invalid JSON', async () => {
    render(<ImportView store={makeStore()} onBack={vi.fn()} />);
    const badJson = 'not valid json {{{';
    const file = new File([badJson], 'vocab.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]');

    global.FileReader = class {
      readAsText() {
        setTimeout(() => {
          this.onload({ target: { result: badJson } });
        }, 0);
      }
    };

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/parse error/i)).toBeInTheDocument();
    });
  });
});
