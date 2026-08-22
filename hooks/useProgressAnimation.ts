"use client";

import { useState, useCallback, useRef } from "react";

interface ProgressAnimationState {
  progress: number;
  isComplete: boolean;
}

export function useProgressAnimation(initial = 0, max = 100) {
  const [state, setState] = useState<ProgressAnimationState>({
    progress: initial,
    isComplete: initial >= max,
  });
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);
  // L6: track whether we are currently complete so the timeout can be
  // scheduled outside the setState updater (side effects in updaters are unsafe)
  const isCompleteRef = useRef(initial >= max);

  const animateTo = useCallback((target: number, onComplete?: () => void) => {
    onCompleteRef.current = onComplete;
    const clamped = Math.min(max, Math.max(0, target));
    const nowComplete = clamped >= max && !isCompleteRef.current;
    isCompleteRef.current = clamped >= max;
    setState({ progress: clamped, isComplete: clamped >= max });
    // L6: setTimeout is outside the updater — no side effects during render
    if (nowComplete) setTimeout(() => onCompleteRef.current?.(), 600);
  }, [max]);

  const reset = useCallback((value = 0) => {
    isCompleteRef.current = false;
    setState({ progress: Math.max(0, value), isComplete: false });
  }, []);

  return {
    progress: state.progress,
    isComplete: state.isComplete,
    animateTo,
    reset,
    max,
  };
}
