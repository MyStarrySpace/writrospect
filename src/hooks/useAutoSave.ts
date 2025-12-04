import { useState, useRef, useCallback, useEffect } from "react";

interface AutoSaveOptions<T> {
  onSave: (data: T) => Promise<void>;
  getChangeDescription?: (previous: T, current: T) => string;
  debounceMs?: number;
  bannerDurationMs?: number;
}

interface AutoSaveState<T> {
  previousValue: T | null;
  showBanner: boolean;
  timeRemaining: number;
  changeDescription: string;
}

export function useAutoSave<T>(
  currentValue: T,
  options: AutoSaveOptions<T>
) {
  const { onSave, getChangeDescription, debounceMs = 1000, bannerDurationMs = 5000 } = options;

  const [state, setState] = useState<AutoSaveState<T>>({
    previousValue: null,
    showBanner: false,
    timeRemaining: bannerDurationMs,
    changeDescription: "Changes saved",
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const lastSavedValueRef = useRef<string>("");

  const clearTimers = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const hideBanner = useCallback(() => {
    clearTimers();
    setState((prev) => ({
      ...prev,
      showBanner: false,
      previousValue: null,
      timeRemaining: bannerDurationMs,
    }));
  }, [clearTimers, bannerDurationMs]);

  const showSaveBanner = useCallback(
    (previousValue: T, description: string) => {
      clearTimers();
      setState({
        previousValue,
        showBanner: true,
        timeRemaining: bannerDurationMs,
        changeDescription: description,
      });

      // Start countdown
      const startTime = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, bannerDurationMs - elapsed);
        setState((prev) => ({ ...prev, timeRemaining: remaining }));
      }, 50);

      // Auto-hide banner after duration
      bannerTimerRef.current = setTimeout(hideBanner, bannerDurationMs);
    },
    [clearTimers, hideBanner, bannerDurationMs]
  );

  const performSave = useCallback(
    async (valueToSave: T, previousValue: T) => {
      try {
        await onSave(valueToSave);
        lastSavedValueRef.current = JSON.stringify(valueToSave);
        const description = getChangeDescription
          ? getChangeDescription(previousValue, valueToSave)
          : "Changes saved";
        showSaveBanner(previousValue, description);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    },
    [onSave, getChangeDescription, showSaveBanner]
  );

  const undo = useCallback(async () => {
    if (state.previousValue !== null) {
      clearTimers();
      try {
        await onSave(state.previousValue);
        lastSavedValueRef.current = JSON.stringify(state.previousValue);
      } catch (error) {
        console.error("Undo failed:", error);
      }
      setState({
        previousValue: null,
        showBanner: false,
        timeRemaining: bannerDurationMs,
        changeDescription: "Changes saved",
      });
      return state.previousValue;
    }
    return null;
  }, [state.previousValue, onSave, clearTimers, bannerDurationMs]);

  // Effect to handle auto-save on value changes
  useEffect(() => {
    const currentValueStr = JSON.stringify(currentValue);

    // Skip initial render
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastSavedValueRef.current = currentValueStr;
      return;
    }

    // Skip if value hasn't changed from last saved
    if (currentValueStr === lastSavedValueRef.current) {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Store the previous value before saving
    const previousValue = JSON.parse(lastSavedValueRef.current) as T;

    // Set up debounced save
    debounceTimerRef.current = setTimeout(() => {
      performSave(currentValue, previousValue);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentValue, debounceMs, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [clearTimers]);

  return {
    showBanner: state.showBanner,
    timeRemaining: state.timeRemaining,
    bannerDuration: bannerDurationMs,
    changeDescription: state.changeDescription,
    undo,
    dismissBanner: hideBanner,
  };
}
