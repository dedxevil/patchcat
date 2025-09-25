import { useState, useEffect } from 'react';

// Return type for the setter function is updated to be more correct, matching React's own setter type.
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevState: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
        console.error(error);
    }
  }, [key, storedValue]);
  
  // By returning the setter from useState directly, we guarantee it's a stable function.
  // The previous implementation created a new, unstable function on every render,
  // causing state persistence issues.
  return [storedValue, setStoredValue];
}
