import { useEffect, useRef, RefObject } from "react";

export const useInfiniteScroll = (
  targetRef: RefObject<HTMLElement | null>, // allow null
  callback: () => void,
  dependencies: any[] = []
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRef, ...dependencies]);
};
