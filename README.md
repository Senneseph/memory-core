# memory-core

memory-core is a unified storage abstraction layer for the WebAX ecosystem. It provides a consistent interface for accessing various storage mechanisms, from browser storage to network storage, with built-in support for access control, caching, and synchronization.

## Overview

In the WebAX ecosystem, memory-core serves as the central storage mechanism that all applications should use. The core principle is that only the "mother-brain" business logic should interact with memory-core, never UI components directly.

## Key Features

- **Unified API**: Consistent interface for all storage types
- **Multi-level Storage**: Support for browser storage, network storage, and more
- **Access Control**: Enforces proper access patterns and permissions
- **Transparent Caching**: Optimizes performance with intelligent caching
- **Offline Support**: Handles offline scenarios gracefully with sync capabilities
- **Encryption**: Optional encryption for sensitive data
- **Transactions**: Support for atomic operations across storage types

## Storage Types

memory-core abstracts the following storage mechanisms:

### Browser Storage
- **LocalStorage**: Persistent browser storage (limited to ~5MB)
- **SessionStorage**: Temporary browser storage that clears on session end
- **IndexedDB**: Structured browser database for larger datasets
- **Cache API**: For caching network resources
- **Cookies**: For small, sensitive data with expiration control

### Network Storage
- **MinIO**: S3-compatible object storage for larger files and data
- **RESTful APIs**: For server-side data persistence
- **WebSockets**: For real-time data synchronization

## Architecture

```
+---------------------------------------------------------------+
|                        Application                            |
+---------------------------------------------------------------+
|                        jcule Engine                           |
+---------------------------------------------------------------+
|                        mother-brain                           |
|                      (Business Logic)                         |
+---------------------------------------------------------------+
|                        memory-core                            |
+---------------------------------------------------------------+
|                                                               |
|  +----------------+  +----------------+  +----------------+   |
|  | Browser Store  |  | Network Store  |  | Sync Manager   |   |
|  +----------------+  +----------------+  +----------------+   |
|                                                               |
|  +----------------+  +----------------+  +----------------+   |
|  | Access Control |  | Cache Manager  |  | Encryption     |   |
|  +----------------+  +----------------+  +----------------+   |
|                                                               |
+---------------------------------------------------------------+
```

## Installation

```bash
npm install @net.webax/memory-core
```

## Basic Usage

```typescript
import { MemoryCore, StoreType } from '@net.webax/memory-core';

// Initialize memory-core
const memory = new MemoryCore();

// Store data
await memory.set('user-preferences', { theme: 'dark', fontSize: 16 });

// Retrieve data
const preferences = await memory.get('user-preferences');
console.log(preferences.theme); // 'dark'

// Remove data
await memory.remove('user-preferences');

// Use different storage types
await memory.useStore(StoreType.LOCAL_STORAGE).set('local-data', { value: 'stored locally' });
await memory.useStore(StoreType.MINIO).set('large-dataset', largeDataObject);
```

## Working with Collections

```typescript
// Get a collection
const tasksCollection = await memory.getCollection('tasks');

// Find items
const incompleteTasks = await tasksCollection.find({ completed: false });

// Insert an item
await tasksCollection.insert({ 
  id: generateId(),
  title: 'Complete documentation',
  completed: false,
  dueDate: new Date('2023-12-31')
});

// Update items
await tasksCollection.update(
  { completed: false }, 
  { reminder: true }
);

// Count items
const taskCount = await tasksCollection.count();
```

## Transactions

```typescript
await memory.transaction(async (store) => {
  const user = await store.get('current-user');
  user.lastActive = new Date();
  user.activityCount += 1;
  await store.set('current-user', user);
  
  const stats = await store.get('app-stats');
  stats.totalActivities += 1;
  await store.set('app-stats', stats);
});
```

## Access Control

```typescript
// Set access policy
memory.setAccessPolicy({
  read: [
    { pattern: 'public-*', allow: true },
    { pattern: 'user-*', allow: true },
    { pattern: 'admin-*', allow: false }
  ],
  write: [
    { pattern: 'user-preferences', allow: true },
    { pattern: 'system-*', allow: false }
  ],
  delete: [
    { pattern: 'user-temp-*', allow: true },
    { pattern: /.*/, allow: false } // Default deny for delete
  ]
});
```

## Integration with mother-brain

The mother-brain business logic layer should be the only component that directly interacts with memory-core:

```typescript
// mother-brain.ts
class MotherBrain {
  private memory: MemoryCore;
  
  constructor() {
    this.memory = new MemoryCore();
    this.initializeAccessPolicies();
  }
  
  private initializeAccessPolicies() {
    // Set up access policies based on application needs
    this.memory.setAccessPolicy({
      // ... access rules
    });
  }
  
  // Business logic methods that use memory-core
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    return this.memory.get(`user-${userId}-preferences`);
  }
  
  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    await this.memory.set(`user-${userId}-preferences`, preferences);
  }
  
  async getGameData(gameId: string): Promise<GameData> {
    // Try local cache first
    let gameData = await this.memory.useStore(StoreType.CACHE_API).get(`game-${gameId}`);
    
    // If not found, fetch from network
    if (!gameData) {
      gameData = await this.fetchGameDataFromNetwork(gameId);
      
      // Cache the result
      await this.memory.useStore(StoreType.CACHE_API).set(`game-${gameId}`, gameData, {
        expiration: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
    
    return gameData;
  }
  
  private async fetchGameDataFromNetwork(gameId: string): Promise<GameData> {
    // Implementation details...
  }
}
```

## API Reference

### MemoryCore

```typescript
interface MemoryCore {
  // Basic CRUD operations
  get<T>(key: string, options?: StoreOptions): Promise<T | null>;
  set<T>(key: string, value: T, options?: StoreOptions): Promise<void>;
  remove(key: string, options?: StoreOptions): Promise<void>;
  clear(options?: StoreOptions): Promise<void>;
  
  // Collection operations
  getCollection<T>(collectionName: string, options?: StoreOptions): Promise<Collection<T>>;
  
  // Transaction support
  transaction<T>(callback: (store: TransactionStore) => Promise<T>): Promise<T>;
  
  // Storage type selection
  useStore(storeType: StoreType): MemoryCore;
  
  // Sync operations
  sync(): Promise<SyncResult>;
  
  // Access control
  setAccessPolicy(policy: AccessPolicy): void;
}
```

### StoreOptions

```typescript
interface StoreOptions {
  storeType?: StoreType;
  expiration?: number; // Time in milliseconds
  encrypt?: boolean;
  compress?: boolean;
  priority?: CachePriority;
  tags?: string[];
}
```

### StoreType

```typescript
enum StoreType {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  CACHE_API = 'cacheAPI',
  COOKIES = 'cookies',
  MINIO = 'minio',
  REST_API = 'restApi',
  WEBSOCKET = 'websocket'
}
```

### Collection

```typescript
interface Collection<T> {
  find(query?: Query<T>): Promise<T[]>;
  findOne(query: Query<T>): Promise<T | null>;
  insert(item: T): Promise<T>;
  update(query: Query<T>, updates: Partial<T>): Promise<number>;
  remove(query: Query<T>): Promise<number>;
  count(query?: Query<T>): Promise<number>;
}
```

### Query

```typescript
interface Query<T> {
  [key: string]: any;
}
```

### TransactionStore

```typescript
interface TransactionStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  abort(): void;
}
```

### SyncResult

```typescript
interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: Error[];
}
```

### AccessPolicy

```typescript
interface AccessPolicy {
  read: AccessRule[];
  write: AccessRule[];
  delete: AccessRule[];
}

interface AccessRule {
  pattern: string | RegExp;
  allow: boolean;
}
```

## Best Practices

1. **Use mother-brain**: Only the mother-brain business logic should interact with memory-core, never UI components directly.

2. **Use Collections for Structured Data**: For structured data with querying needs, use collections instead of individual keys.

3. **Set Appropriate Expirations**: Set appropriate expiration times for cached data to ensure freshness.

4. **Use Transactions for Related Operations**: When multiple operations need to be atomic, use transactions.

5. **Define Clear Access Policies**: Define clear access policies to ensure proper data access control.

6. **Handle Offline Scenarios**: Design your application to work offline and sync when connectivity is restored.

7. **Use Appropriate Storage Types**: Choose the appropriate storage type based on data size, persistence needs, and access patterns.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
