import { type RefCallback, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks whether the referenced element is in (or within one viewport of)
 * the visible area, using an IntersectionObserver with 100% root margin.
 * Returns a callback ref and the current visibility state.
 */
export function useInView<T extends Element>(): [RefCallback<T>, boolean] {
    const [isInView, setIsInView] = useState(false);
    const observerRef = useRef<IntersectionObserver>();

    const ref = useCallback<RefCallback<T>>(node => {
        observerRef.current?.disconnect();

        if (!node) {
            setIsInView(false);
            return;
        }

        observerRef.current = new IntersectionObserver(entries => {
            setIsInView(entries.some(entry => entry.isIntersecting));
        }, { rootMargin: '100%' });
        observerRef.current.observe(node);
    }, []);

    useEffect(() => () => observerRef.current?.disconnect(), []);

    return [ref, isInView];
}
