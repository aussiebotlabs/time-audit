import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEntry } from './app.js';

describe('Time Audit Logic', () => {
    it('should create a valid entry object', () => {
        const startTime = new Date('2026-02-05T10:00:00Z');
        const endTime = new Date('2026-02-05T10:15:00Z');
        const transcript = 'Working on tests';
        
        const entry = createEntry(transcript, startTime, endTime);
        
        expect(entry.transcript).toBe('Working on tests');
        expect(entry.startTime).toBe(startTime.toISOString());
        expect(entry.endTime).toBe(endTime.toISOString());
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('recordedAt');
    });

    it('should trim transcript text', () => {
        const entry = createEntry('  text with spaces  ', new Date(), new Date());
        expect(entry.transcript).toBe('text with spaces');
    });
});
