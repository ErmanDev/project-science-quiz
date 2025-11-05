import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        // FIX: Implement persistent state logic to read from localStorage.
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                return JSON.parse(storedValue);
            }
        } catch (error) {
            console.error(`Error parsing localStorage item with key "${key}":`, error);
        }
        return defaultValue;
    });

    useEffect(() => {
        // FIX: Implement persistent state logic to write to localStorage.
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage item with key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}
