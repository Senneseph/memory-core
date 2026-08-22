/**
 * memory-core — WebAX unified storage abstraction layer.
 *
 * A consistent interface over browser + network storage with access control,
 * caching, and synchronization. Only the mother-brain (jcule) should use it.
 */

export { MemoryCore, ruleAllows } from './memory-core.js';
export type { MemoryCoreOptions, AccessPolicy, AccessRule } from './memory-core.js';
export { memoryBackend, webStorageBackend } from './stores.js';
export type { StoreType, KVBackend } from './stores.js';
export { createCollection, matches } from './collection.js';
export type { Collection, Query, CollectionBackend } from './collection.js';
