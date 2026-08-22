/** Storage backends. Values are JSON-serializable and de/serialized transparently. */

export type StoreType = 'memory' | 'localStorage' | 'sessionStorage';

export interface KVBackend {
  readonly type: StoreType;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

/** In-memory backend (default). */
export function memoryBackend(initial: Record<string, unknown> = {}): KVBackend {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    type: 'memory',
    get: (key) => data.get(key),
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
    clear: () => data.clear(),
    keys: () => [...data.keys()],
  };
}

/** Backend backed by a Web Storage `Storage` object (localStorage / sessionStorage). */
export function webStorageBackend(storage: Storage, type: StoreType): KVBackend {
  return {
    type,
    get: (key) => {
      const raw = storage.getItem(key);
      if (raw === null) return undefined;
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return raw;
      }
    },
    set: (key, value) => storage.setItem(key, JSON.stringify(value)),
    remove: (key) => storage.removeItem(key),
    clear: () => storage.clear(),
    keys: () => Object.keys(storage),
  };
}
