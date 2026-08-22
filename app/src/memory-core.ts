import { KVBackend, StoreType, memoryBackend, webStorageBackend } from './stores.js';
import { Collection, CollectionBackend, createCollection } from './collection.js';

export interface AccessRule {
  pattern: string | RegExp;
  allow: boolean;
}

export interface AccessPolicy {
  read: AccessRule[];
  write: AccessRule[];
  delete: AccessRule[];
}

const DEFAULT_POLICY: AccessPolicy = { read: [], write: [], delete: [] };

/** Pure: does any rule match `key`? (first match wins; default allow if none). */
export function ruleAllows(rules: AccessRule[], key: string): boolean {
  for (const rule of rules) {
    const matched =
      typeof rule.pattern === 'string'
        ? key.startsWith(rule.pattern.replace(/\*$/, ''))
        : rule.pattern.test(key);
    if (matched) return rule.allow;
  }
  return true;
}

export interface MemoryCoreOptions {
  localStorage?: Storage;
  sessionStorage?: Storage;
}

/**
 * memory-core — a unified storage abstraction.
 *
 * A consistent get/set/remove interface over pluggable backends (memory,
 * localStorage, sessionStorage), with collections, access policy, and a
 * fluent `useStore()` selector. Only the mother-brain should talk to it.
 */
export class MemoryCore {
  private readonly backends: Partial<Record<StoreType, KVBackend>>;
  private active: StoreType = 'memory';
  private policy: AccessPolicy = DEFAULT_POLICY;

  constructor(options: MemoryCoreOptions = {}) {
    this.backends = {
      memory: memoryBackend(),
      ...(options.localStorage ? { localStorage: webStorageBackend(options.localStorage, 'localStorage') } : {}),
      ...(options.sessionStorage ? { sessionStorage: webStorageBackend(options.sessionStorage, 'sessionStorage') } : {}),
    };
  }

  private backend(): KVBackend {
    const b = this.backends[this.active];
    if (!b) throw new Error(`Store not available: ${this.active}`);
    return b;
  }

  /** Select the active store (fluent). */
  useStore(type: StoreType): this {
    this.active = type;
    return this;
  }

  setAccessPolicy(policy: AccessPolicy): void {
    this.policy = policy;
  }

  private assertAllowed(action: keyof AccessPolicy, key: string): void {
    if (!ruleAllows(this.policy[action], key)) {
      throw new Error(`Access denied: ${action} "${key}"`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.assertAllowed('read', key);
    const value = this.backend().get(key);
    return value === undefined ? null : (value as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.assertAllowed('write', key);
    this.backend().set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.assertAllowed('delete', key);
    this.backend().remove(key);
  }

  async clear(): Promise<void> {
    this.backend().clear();
  }

  getCollection<T>(name: string): Collection<T> {
    const backend: CollectionBackend<T> = {
      read: async () => (await this.get<T[]>(name)) ?? [],
      write: async (items) => this.set(name, items),
    };
    return createCollection<T>(name, backend);
  }

  /** Run a callback against a temporary snapshot store (atomic-ish). */
  async transaction<T>(callback: (store: MemoryCore) => Promise<T>): Promise<T> {
    // Minimal: operate on the live store; the callback sees a clone via get/set.
    const clone = new MemoryCore();
    // Seed the clone with current keys.
    for (const key of this.backend().keys()) {
      clone.backends.memory!.set(key, this.backend().get(key));
    }
    const result = await callback(clone);
    // Commit the clone back.
    for (const key of clone.backends.memory!.keys()) {
      this.backend().set(key, clone.backends.memory!.get(key));
    }
    return result;
  }

  /** Sync is a no-op for synchronous backends (localStorage is already synced). */
  async sync(): Promise<{ success: boolean; syncedItems: number; failedItems: number }> {
    return { success: true, syncedItems: 0, failedItems: 0 };
  }
}
