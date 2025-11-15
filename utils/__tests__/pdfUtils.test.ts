import { describe, it, expect, beforeEach, vi } from 'vitest';
import { downloadElementAsPdf, downloadElementsAsPdf } from '../pdfUtils';

class FakeCanvas {
  toDataURL() {
    return 'data:image/png;base64,fake';
  }
}

class FakePDF {
  addImage() {}
  addPage() {}
  output(_type: string) {
    return new Blob(['pdf']);
  }
  save() {}
}

const setupWindowLibs = () => {
  (window as any).html2canvas = vi.fn(async (_el: HTMLElement) => new FakeCanvas());
  (window as any).jspdf = { jsPDF: FakePDF };
  (globalThis as any).URL = (globalThis as any).URL || {};
  (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:fake');
  (globalThis as any).URL.revokeObjectURL = vi.fn();
};

describe('pdfUtils cancellation', () => {
  beforeEach(() => {
    setupWindowLibs();
    vi.restoreAllMocks();
  });

  it('does not trigger download when pre-cancelled', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    await downloadElementAsPdf(el, 'test', { shouldCancel: () => true });
    expect(appendSpy).not.toHaveBeenCalled();
    el.remove();
  });

  it('cancels before adding image', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    let calls = 0;
    await downloadElementAsPdf(el, 'test', { shouldCancel: () => (++calls >= 2) });
    expect(appendSpy).not.toHaveBeenCalled();
    el.remove();
  });

  it('triggers download when not cancelled', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    await downloadElementAsPdf(el, 'ok');
    expect(appendSpy).toHaveBeenCalledOnce();
    el.remove();
  });
});

describe('downloadElementsAsPdf cancellation', () => {
  beforeEach(() => {
    setupWindowLibs();
    vi.restoreAllMocks();
  });

  it('cancels during multi-page rendering', async () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    let calls = 0;
    await downloadElementsAsPdf([el1, el2], 'multi', { shouldCancel: () => (++calls >= 2) });
    expect(appendSpy).not.toHaveBeenCalled();
    el1.remove();
    el2.remove();
  });
});
