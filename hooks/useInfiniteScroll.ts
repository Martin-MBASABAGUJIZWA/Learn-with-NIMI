import { useEffect, RefObject } from "react";

export const useInfiniteScroll = (
  targetRef: RefObject<HTMLElement>,
  callback: () => void,
  dependencies: any[] = []
) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
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
  }, [targetRef, callback, ...dependencies]);
};