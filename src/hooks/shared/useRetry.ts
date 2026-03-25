export function useRetry(fn: () => Promise<void>) { return { retry: () => { void fn(); } }; }
