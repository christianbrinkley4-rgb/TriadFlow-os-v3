"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() => initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!canUseStorage()) {
      setHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        setValue(JSON.parse(raw) as T);
      } else {
        setValue(initialRef.current);
      }
    } catch {
      setValue(initialRef.current);
    }
    setHydrated(true);
  }, [key]);

  const setStored = useCallback(
    (update: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const next =
          typeof update === "function"
            ? (update as (p: T) => T)(previous)
            : update;
        if (canUseStorage()) {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {
            /* ignore quota / private mode */
          }
        }
        return next;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    setStored(initialRef.current);
    if (canUseStorage()) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }, [key, setStored]);

  return useMemo(
    () => ({ value, setStored, hydrated, reset }) as const,
    [hydrated, reset, setStored, value],
  );
}
