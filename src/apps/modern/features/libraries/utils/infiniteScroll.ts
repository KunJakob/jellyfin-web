import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';

/**
 * Whether the infinite scroll option should replace library pagination.
 * A page size of 0 already means "show everything", so infinite scroll
 * only applies for positive page sizes.
 */
export function isInfiniteScrollActive(libraryInfiniteScroll: boolean, libraryPageSize: number): boolean {
    return libraryInfiniteScroll && libraryPageSize > 0;
}

/**
 * The StartIndex for the next page of an accumulated result set,
 * or undefined when every item has been loaded.
 */
export function getNextStartIndex(pages: ItemDtoQueryResult[]): number | undefined {
    if (!pages.length) return undefined;

    // A page that contributed no items means the server cannot make forward
    // progress; stop to avoid refetching the same start index in a loop.
    if (!pages[pages.length - 1]?.Items?.length) return undefined;

    const loaded = pages.reduce((count, curPage) => count + (curPage.Items?.length ?? 0), 0);
    const total = pages[pages.length - 1]?.TotalRecordCount ?? 0;

    return loaded < total ? loaded : undefined;
}
