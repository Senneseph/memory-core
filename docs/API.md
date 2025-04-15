# memory-core API Reference

This document provides a detailed reference for the memory-core API.

## Core API

### MemoryCore

The main interface for interacting with memory-core.

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

#### Methods

##### `get<T>(key: string, options?: StoreOptions): Promise<T | null>`

Retrieves a value from storage.

- **Parameters**:
  - `key`: The key to retrieve
  - `options`: Optional storage options
- **Returns**: A promise that resolves with the value, or null if not found
- **Example**:
  ```typescript
  const preferences = await memory.get('user-preferences');
  ```

##### `set<T>(key: string, value: T, options?: StoreOptions): Promise<void>`

Stores a value in storage.

- **Parameters**:
  - `key`: The key to store
  - `value`: The value to store
  - `options`: Optional storage options
- **Returns**: A promise that resolves when the value is stored
- **Example**:
  ```typescript
  await memory.set('user-preferences', { theme: 'dark', fontSize: 16 });
  ```

##### `remove(key: string, options?: StoreOptions): Promise<void>`

Removes a value from storage.

- **Parameters**:
  - `key`: The key to remove
  - `options`: Optional storage options
- **Returns**: A promise that resolves when the value is removed
- **Example**:
  ```typescript
  await memory.remove('user-preferences');
  ```

##### `clear(options?: StoreOptions): Promise<void>`

Clears all values from storage.

- **Parameters**:
  - `options`: Optional storage options
- **Returns**: A promise that resolves when all values are cleared
- **Example**:
  ```typescript
  await memory.clear();
  ```

##### `getCollection<T>(collectionName: string, options?: StoreOptions): Promise<Collection<T>>`

Gets a collection for working with structured data.

- **Parameters**:
  - `collectionName`: The name of the collection
  - `options`: Optional storage options
- **Returns**: A promise that resolves with a Collection instance
- **Example**:
  ```typescript
  const tasksCollection = await memory.getCollection('tasks');
  ```

##### `transaction<T>(callback: (store: TransactionStore) => Promise<T>): Promise<T>`

Performs a transaction with atomic operations.

- **Parameters**:
  - `callback`: A function that receives a TransactionStore and performs operations
- **Returns**: A promise that resolves with the result of the callback
- **Example**:
  ```typescript
  await memory.transaction(async (store) => {
    const user = await store.get('current-user');
    user.lastActive = new Date();
    await store.set('current-user', user);
  });
  ```

##### `useStore(storeType: StoreType): MemoryCore`

Selects a specific storage type for subsequent operations.

- **Parameters**:
  - `storeType`: The storage type to use
- **Returns**: A MemoryCore instance configured to use the specified storage type
- **Example**:
  ```typescript
  await memory.useStore(StoreType.LOCAL_STORAGE).set('local-data', { value: 'stored locally' });
  ```

##### `sync(): Promise<SyncResult>`

Synchronizes data between local and remote storage.

- **Returns**: A promise that resolves with the synchronization result
- **Example**:
  ```typescript
  const result = await memory.sync();
  console.log(`Synced ${result.syncedItems} items`);
  ```

##### `setAccessPolicy(policy: AccessPolicy): void`

Sets the access policy for storage operations.

- **Parameters**:
  - `policy`: The access policy to set
- **Example**:
  ```typescript
  memory.setAccessPolicy({
    read: [
      { pattern: 'public-*', allow: true },
      { pattern: 'user-*', allow: true }
    ],
    write: [
      { pattern: 'user-preferences', allow: true }
    ],
    delete: [
      { pattern: 'user-temp-*', allow: true }
    ]
  });
  ```

### StoreOptions

Options for storage operations.

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

#### Properties

- `storeType`: The storage type to use
- `expiration`: Time in milliseconds until the value expires
- `encrypt`: Whether to encrypt the value
- `compress`: Whether to compress the value
- `priority`: The cache priority for the value
- `tags`: Tags for categorizing the value

### StoreType

Enum for different storage types.

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

### CachePriority

Enum for cache priorities.

```typescript
enum CachePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}
```

## Collection API

### Collection

Interface for working with collections of structured data.

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

#### Methods

##### `find(query?: Query<T>): Promise<T[]>`

Finds items in the collection that match the query.

- **Parameters**:
  - `query`: Optional query to filter items
- **Returns**: A promise that resolves with an array of matching items
- **Example**:
  ```typescript
  const incompleteTasks = await tasksCollection.find({ completed: false });
  ```

##### `findOne(query: Query<T>): Promise<T | null>`

Finds a single item in the collection that matches the query.

- **Parameters**:
  - `query`: Query to filter items
- **Returns**: A promise that resolves with the matching item, or null if not found
- **Example**:
  ```typescript
  const task = await tasksCollection.findOne({ id: '123' });
  ```

##### `insert(item: T): Promise<T>`

Inserts an item into the collection.

- **Parameters**:
  - `item`: The item to insert
- **Returns**: A promise that resolves with the inserted item
- **Example**:
  ```typescript
  const newTask = await tasksCollection.insert({ 
    id: generateId(),
    title: 'Complete documentation',
    completed: false
  });
  ```

##### `update(query: Query<T>, updates: Partial<T>): Promise<number>`

Updates items in the collection that match the query.

- **Parameters**:
  - `query`: Query to filter items
  - `updates`: Partial item with fields to update
- **Returns**: A promise that resolves with the number of updated items
- **Example**:
  ```typescript
  const updatedCount = await tasksCollection.update(
    { completed: false }, 
    { reminder: true }
  );
  ```

##### `remove(query: Query<T>): Promise<number>`

Removes items from the collection that match the query.

- **Parameters**:
  - `query`: Query to filter items
- **Returns**: A promise that resolves with the number of removed items
- **Example**:
  ```typescript
  const removedCount = await tasksCollection.remove({ completed: true });
  ```

##### `count(query?: Query<T>): Promise<number>`

Counts items in the collection that match the query.

- **Parameters**:
  - `query`: Optional query to filter items
- **Returns**: A promise that resolves with the count
- **Example**:
  ```typescript
  const taskCount = await tasksCollection.count();
  ```

### Query

Interface for querying collections.

```typescript
interface Query<T> {
  [key: string]: any;
}
```

memory-core supports a MongoDB-like query syntax:

```typescript
// Simple equality
const task = await tasksCollection.findOne({ id: '123' });

// Comparison operators
const tasks = await tasksCollection.find({
  dueDate: { $lt: new Date() },
  priority: { $gte: 2 }
});

// Logical operators
const tasks = await tasksCollection.find({
  $or: [
    { completed: true },
    { priority: { $lt: 2 } }
  ]
});

// Regular expressions
const tasks = await tasksCollection.find({
  title: { $regex: /important/i }
});
```

## Transaction API

### TransactionStore

Interface for performing operations within a transaction.

```typescript
interface TransactionStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  abort(): void;
}
```

#### Methods

##### `get<T>(key: string): Promise<T | null>`

Retrieves a value within the transaction.

- **Parameters**:
  - `key`: The key to retrieve
- **Returns**: A promise that resolves with the value, or null if not found

##### `set<T>(key: string, value: T): Promise<void>`

Stores a value within the transaction.

- **Parameters**:
  - `key`: The key to store
  - `value`: The value to store
- **Returns**: A promise that resolves when the value is stored

##### `remove(key: string): Promise<void>`

Removes a value within the transaction.

- **Parameters**:
  - `key`: The key to remove
- **Returns**: A promise that resolves when the value is removed

##### `abort(): void`

Aborts the transaction.

## Sync API

### SyncResult

Interface for synchronization results.

```typescript
interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: Error[];
}
```

#### Properties

- `success`: Whether the synchronization was successful
- `syncedItems`: Number of items successfully synchronized
- `failedItems`: Number of items that failed to synchronize
- `errors`: Array of errors that occurred during synchronization

## Access Control API

### AccessPolicy

Interface for access control policies.

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

#### Properties

- `read`: Array of rules for read operations
- `write`: Array of rules for write operations
- `delete`: Array of rules for delete operations

### AccessRule

Interface for access control rules.

```typescript
interface AccessRule {
  pattern: string | RegExp;
  allow: boolean;
}
```

#### Properties

- `pattern`: String or regular expression pattern to match keys
- `allow`: Whether to allow or deny access for matching keys

## Error Handling

memory-core throws the following error types:

### MemoryCoreError

Base error class for all memory-core errors.

```typescript
class MemoryCoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryCoreError';
  }
}
```

### AccessDeniedError

Thrown when access to a key is denied by the access policy.

```typescript
class AccessDeniedError extends MemoryCoreError {
  constructor(key: string, operation: 'read' | 'write' | 'delete') {
    super(`Access denied for ${operation} operation on key "${key}"`);
    this.name = 'AccessDeniedError';
  }
}
```

### NotFoundError

Thrown when a key is not found.

```typescript
class NotFoundError extends MemoryCoreError {
  constructor(key: string) {
    super(`Key "${key}" not found`);
    this.name = 'NotFoundError';
  }
}
```

### StorageError

Thrown when an error occurs in the underlying storage.

```typescript
class StorageError extends MemoryCoreError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}
```

### TransactionError

Thrown when an error occurs in a transaction.

```typescript
class TransactionError extends MemoryCoreError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'TransactionError';
    this.cause = cause;
  }
}
```

### SyncError

Thrown when an error occurs during synchronization.

```typescript
class SyncError extends MemoryCoreError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SyncError';
    this.cause = cause;
  }
}
```
