import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import React, { type FC, useEffect } from 'react';

import { useInView } from 'hooks/useInView';
import globalize from 'lib/globalize';

import type { LibraryInfiniteScrollState } from '../hooks/useLibrary';

interface InfiniteScrollSentinelProps {
    infiniteScroll: LibraryInfiniteScrollState;
}

/**
 * Invisible trigger rendered below the item grid. Fetches the next batch
 * when scrolled within one viewport of the end, shows a spinner while
 * fetching and a retry button when the fetch fails.
 */
const InfiniteScrollSentinel: FC<InfiniteScrollSentinelProps> = ({ infiniteScroll }) => {
    const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = infiniteScroll;
    const [sentinelRef, isInView] = useInView<HTMLDivElement>();

    useEffect(() => {
        if (isInView && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
            fetchNextPage();
        }
    }, [isInView, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

    if (!hasNextPage) return null;

    return (
        <Box
            ref={sentinelRef}
            sx={{ display: 'flex', justifyContent: 'center', padding: 2, minHeight: 48 }}
        >
            {isFetchingNextPage && <CircularProgress size={32} />}
            {isFetchNextPageError && !isFetchingNextPage && (
                <Button variant='outlined' onClick={fetchNextPage}>
                    {globalize.translate('Retry')}
                </Button>
            )}
        </Box>
    );
};

export default InfiniteScrollSentinel;
