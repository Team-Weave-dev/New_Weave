import { RefObject, useEffect, useState } from 'react';

interface UseIntersectionObserverProps {
  ref: RefObject<Element>;
  options?: IntersectionObserverInit;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  ref,
  options = {},
  freezeOnceVisible = false,
}: UseIntersectionObserverProps): IntersectionObserverEntry | undefined {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const node = ref?.current;
    if (!node || frozen) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      options
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, options, frozen]);

  return entry;
}

// Lazy loading hook
export function useLazyLoad(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const entry = useIntersectionObserver({
    ref,
    options: {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    },
    freezeOnceVisible: true,
  });

  return entry?.isIntersecting || false;
}