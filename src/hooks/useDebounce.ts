import { useState, useEffect } from 'react';

/**
 * Delays propagating a value change until the given delay (in ms) has
 * elapsed without a new change arriving.  Useful for reducing the rate of
 * expensive operations triggered by fast user input, such as live search.
 *
 * @param value  The value to debounce.
 * @param delay  How long to wait (in milliseconds) after the last change.
 * @returns      The debounced value, which only updates once the timer expires.
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 400);
 *
 * useEffect(() => {
 *   if (debouncedQuery) fetchResults(debouncedQuery);
 * }, [debouncedQuery]);
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
