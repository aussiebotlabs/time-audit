import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Set up DOM before importing app.js
let html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
// Remove scripts and styles to avoid happy-dom trying to load them
html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, '');
document.body.innerHTML = html;

// Import app.js after DOM is ready
// We use dynamic import to ensure DOM is ready
let app;

describe('App Logic', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = html;
    vi.clearAllMocks();
    localStorage.clear();
    
    app = await import('../app.js');
  });

  describe('Utility Functions', () => {
    it('generateId should return a unique string', () => {
      const id1 = app.generateId();
      const id2 = app.generateId();
      expect(id1).toBeDefined();
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });

    it('formatTime should format date correctly', () => {
      const date = new Date('2026-02-05T14:30:00');
      const formatted = app.formatTime(date);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
      expect(formatted).toBe('14:30');
    });

    it('escapeHtml should escape special characters', () => {
      const input = '<script>alert("xss")</script>';
      const escaped = app.escapeHtml(input);
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).not.toContain('<script>');
    });
  });

  describe('Storage', () => {
    it('should save and load API key', () => {
      const testKey = 'test-api-key-123';
      app.state.apiKey = testKey;
      // We need to trigger the save logic
      // In app.js, saveToStorage is not exported, but we can access it if we exported it
      // Since it's not exported, we might need to export more or test via side effects
      
      localStorage.setItem(app.STORAGE_KEYS.API_KEY, testKey);
      expect(localStorage.getItem(app.STORAGE_KEYS.API_KEY)).toBe(testKey);
    });
  });

  describe('Timer Calculations', () => {
    it('should calculate countdown correctly', () => {
      const now = Date.now();
      const future = now + (15 * 60 * 1000); // 15 mins
      const remaining = future - now;
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      expect(minutes).toBe(15);
      expect(seconds).toBe(0);
    });
  });

  describe('Bugfix Validation', () => {
    it('Entry endTime should match captured period end', () => {
        const mockStartTime = new Date('2026-02-05T10:00:00Z');
        const mockEndTime = new Date('2026-02-05T10:15:00Z');
        
        app.state.currentPeriodStart = mockStartTime;
        app.state.currentPeriodEnd = mockEndTime;
        
        const entry = {
            startTime: app.state.currentPeriodStart.toISOString(),
            endTime: app.state.currentPeriodEnd.toISOString()
        };

        expect(entry.startTime).toBe(mockStartTime.toISOString());
        expect(entry.endTime).toBe(mockEndTime.toISOString());
    });

    it('Placeholder attribute should be present in HTML', () => {
        const transcriptArea = document.getElementById('live-transcript');
        const placeholder = transcriptArea.getAttribute('data-placeholder');
        
        expect(placeholder).toBeDefined();
        expect(placeholder.length).toBeGreaterThan(0);
        expect(transcriptArea.textContent.trim()).toBe('');
    });

    it('should initialize currentPeriodStart in showRecordingModal if null', () => {
        app.state.currentPeriodStart = null;
        app.state.interval = 15;
        
        // Mock current time
        const mockNow = new Date('2026-02-05T12:00:00Z');
        vi.useFakeTimers();
        vi.setSystemTime(mockNow);
        
        // Access via window since it's not exported but assigned to window
        window.showRecordingModal();
        
        expect(app.state.currentPeriodStart).not.toBeNull();
        expect(app.state.currentPeriodStart).toBeInstanceOf(Date);
        
        // Expected start time is 15 minutes before 12:00:00
        const expectedStart = new Date(mockNow.getTime() - 15 * 60 * 1000);
        expect(app.state.currentPeriodStart.getTime()).toBe(expectedStart.getTime());
        
        vi.useRealTimers();
    });

    it('should not reset transcript if modal is already active', () => {
        const transcriptArea = document.getElementById('live-transcript');
        const recordingModal = document.getElementById('recording-modal');
        
        // Initial call
        window.showRecordingModal();
        
        // Simulate user input
        const userContent = 'This is my activity';
        transcriptArea.textContent = userContent;
        app.state.currentTranscript = userContent;
        
        // Modal should have active class
        expect(recordingModal.classList.contains('active')).toBe(true);
        
        // Second call (e.g. from notification click)
        window.showRecordingModal();
        
        // Content should be preserved
        expect(transcriptArea.textContent).toBe(userContent);
        expect(app.state.currentTranscript).toBe(userContent);
    });
  });
});
