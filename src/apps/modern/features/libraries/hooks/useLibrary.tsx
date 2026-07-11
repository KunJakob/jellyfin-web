import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC, type PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';

import useCurrentTab from 'hooks/useCurrentTab';
import { useGetItemsViewByType, useGetItemsViewByTypeInfinite } from 'hooks/useFetchItems';
import { useUserSettings } from 'hooks/useUserSettings';
import { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import { LibraryTabContent } from 'types/libraryTabContent';

import { LibraryRoutes } from '../constants/libraryRoutes';
import { isLibraryPath } from '../utils/path';
import { getDefaultLibraryViewSettings, getSettingsKey } from '../utils/settings';
import { getViewContent } from '../utils/viewContent';
import { isInfiniteScrollActive } from '../utils/infiniteScroll';

export interface LibraryItemsResult {
    data?: ItemDtoQueryResult;
    isPending: boolean;
    isPlaceholderData?: boolean;
    refetch: () => void;
}

export interface LibraryInfiniteScrollState {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError: boolean;
    fetchNextPage: () => void;
}

interface LibraryState {
    collectionType?: CollectionType;
    content?: LibraryTabContent;
    isLibraryPath: boolean;
    id?: string;
    itemsResult?: LibraryItemsResult;
    infiniteScroll?: LibraryInfiniteScrollState;
    viewSettings?: LibraryViewSettings;
    setViewSettings?: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const DEFAULT_LIBRARY_STATE: LibraryState = {
    isLibraryPath: false
};

export const LibraryContext = createContext<LibraryState>(DEFAULT_LIBRARY_STATE);
export const useLibrary = () => useContext(LibraryContext);

export const LibraryProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const { pathname } = useLocation();
    const { libraryId, activeTab } = useCurrentTab();

    const route = useMemo(() => LibraryRoutes.find(({ path }) => path === pathname), [pathname]);
    const collectionType = route?.type;
    const isLibPath = isLibraryPath(pathname);
    const id = libraryId ?? undefined;

    const content = useMemo(() => collectionType && getViewContent(collectionType, activeTab), [collectionType, activeTab]);
    const viewType = content?.viewType;

    // Local storage requires the view type to be known upfront so default to movies if unknown
    const settingsViewType = viewType ?? LibraryTab.Movies;
    const [viewSettings, setViewSettings] = useLocalStorage<LibraryViewSettings>(
        getSettingsKey(settingsViewType, libraryId),
        getDefaultLibraryViewSettings(settingsViewType)
    );

    const { libraryInfiniteScroll, libraryPageSize } = useUserSettings();
    const infiniteScrollActive = isInfiniteScrollActive(libraryInfiniteScroll, libraryPageSize);

    // Both hooks are always called (rules of hooks); the inactive one is disabled.
    const finiteResult = useGetItemsViewByType(
        viewType,
        libraryId,
        content?.itemType,
        viewSettings,
        !infiniteScrollActive
    );
    const infiniteResult = useGetItemsViewByTypeInfinite(
        viewType,
        libraryId,
        content?.itemType,
        viewSettings,
        infiniteScrollActive
    );

    const itemsResult = useMemo<LibraryItemsResult>(() => {
        if (!infiniteScrollActive) return finiteResult;

        const pages = infiniteResult.data?.pages ?? [];
        return {
            data: pages.length ? {
                Items: pages.flatMap(page => page.Items ?? []),
                TotalRecordCount: pages[pages.length - 1]?.TotalRecordCount ?? 0
            } : undefined,
            isPending: infiniteResult.isPending,
            isPlaceholderData: false,
            refetch: infiniteResult.refetch
        };
    }, [infiniteScrollActive, finiteResult, infiniteResult]);

    const infiniteScroll = useMemo<LibraryInfiniteScrollState | undefined>(() => (
        infiniteScrollActive ? {
            hasNextPage: infiniteResult.hasNextPage,
            isFetchingNextPage: infiniteResult.isFetchingNextPage,
            isFetchNextPageError: infiniteResult.isFetchNextPageError,
            fetchNextPage: () => {
                void infiniteResult.fetchNextPage();
            }
        } : undefined
    ), [infiniteScrollActive, infiniteResult]);

    const state = useMemo(() => ({
        ...DEFAULT_LIBRARY_STATE,
        collectionType,
        isLibraryPath: isLibPath,
        id,
        content,
        viewSettings,
        setViewSettings,
        itemsResult,
        infiniteScroll
    }), [collectionType, isLibPath, id, content, viewSettings, setViewSettings, itemsResult, infiniteScroll]);

    return (
        <LibraryContext.Provider value={state}>
            {children}
        </LibraryContext.Provider>
    );
};
