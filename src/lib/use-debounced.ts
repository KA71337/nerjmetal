"use client";

import { useEffect, useState } from "react";

/** Delays a fast-changing value (search input) so filtering does not run on every keystroke. */
export function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
