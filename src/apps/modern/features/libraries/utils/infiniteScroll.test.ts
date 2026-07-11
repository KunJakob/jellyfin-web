import { describe, expect, it } from 'vitest';

import { getNextStartIndex, isInfiniteScrollActive } from './infiniteScroll';

describe('isInfiniteScrollActive', () => {
    it('is active when enabled and page size is positive', () => {
        expect(isInfiniteScrollActive(true, 100)).toBe(true);
    });

    it('is inactive when disabled', () => {
        expect(isInfiniteScrollActive(false, 100)).toBe(false);
    });

    it('is inactive when page size is 0 (show all)', () => {
        expect(isInfiniteScrollActive(true, 0)).toBe(false);
    });
});

describe('getNextStartIndex', () => {
    const page = (count: number, total: number) => ({
        Items: Array.from({ length: count }, (_, i) => ({ Id: `${i}` })),
        TotalRecordCount: total
    });

    it('returns the loaded count while more items remain', () => {
        expect(getNextStartIndex([page(100, 250)])).toBe(100);
        expect(getNextStartIndex([page(100, 250), page(100, 250)])).toBe(200);
    });

    it('returns undefined when the partial last page completes the set', () => {
        expect(getNextStartIndex([page(100, 250), page(100, 250), page(50, 250)])).toBeUndefined();
    });

    it('returns undefined when the total is an exact multiple of the page size', () => {
        expect(getNextStartIndex([page(100, 200), page(100, 200)])).toBeUndefined();
    });

    it('returns undefined for an empty library', () => {
        expect(getNextStartIndex([page(0, 0)])).toBeUndefined();
    });

    it('returns undefined for no pages', () => {
        expect(getNextStartIndex([])).toBeUndefined();
    });

    it('stops when the last page contributed no items', () => {
        expect(getNextStartIndex([{ TotalRecordCount: 10 }])).toBeUndefined();
        expect(getNextStartIndex([page(100, 250), { Items: [], TotalRecordCount: 250 }])).toBeUndefined();
    });
});
