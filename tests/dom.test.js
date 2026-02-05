import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('DOM Validation', () => {
  let doc;

  beforeEach(() => {
    let html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    // Remove scripts and styles to avoid happy-dom trying to load them
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, '');
    document.body.innerHTML = html;
    doc = document;
  });

  it('should have required modal elements', () => {
    expect(doc.getElementById('api-key-modal')).not.toBeNull();
    expect(doc.getElementById('recording-modal')).not.toBeNull();
  });

  it('should have required form elements', () => {
    expect(doc.getElementById('interval-select')).not.toBeNull();
    expect(doc.getElementById('api-key-input')).not.toBeNull();
    expect(doc.getElementById('live-transcript')).not.toBeNull();
  });

  it('should have interval options', () => {
    const select = doc.getElementById('interval-select');
    const options = Array.from(select.options).map(opt => opt.value);
    
    expect(options).toContain('10');
    expect(options).toContain('15');
    expect(options).toContain('20');
    expect(options).toContain('30');
  });

  it('should have export and clear buttons', () => {
    expect(doc.getElementById('export-json-btn')).not.toBeNull();
    expect(doc.getElementById('export-text-btn')).not.toBeNull();
    expect(doc.getElementById('clear-all-btn')).not.toBeNull();
  });
});
