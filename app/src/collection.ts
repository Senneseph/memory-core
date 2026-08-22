/** A queryable collection of records stored under a single key. */

export type Query<T> = Partial<T>;

export interface Collection<T> {
  find(query?: Query<T>): Promise<T[]>;
  findOne(query: Query<T>): Promise<T | null>;
  insert(item: T): Promise<T>;
  update(query: Query<T>, updates: Partial<T>): Promise<number>;
  remove(query: Query<T>): Promise<number>;
  count(query?: Query<T>): Promise<number>;
}

/** Pure: does `item` satisfy every key/value in `query`? */
export function matches<T>(item: T, query: Query<T>): boolean {
  return Object.entries(query).every(
    ([key, value]) => (item as Record<string, unknown>)[key] === value
  );
}

/** A read/write backing store for a collection's item array. */
export interface CollectionBackend<T> {
  read(): Promise<T[]>;
  write(items: T[]): Promise<void>;
}

/** Build a Collection over a read/write array backend. */
export function createCollection<T>(_name: string, backend: CollectionBackend<T>): Collection<T> {
  return {
    async find(query = {}) {
      const items = await backend.read();
      return items.filter((item) => matches(item, query));
    },
    async findOne(query) {
      const items = await backend.read();
      return items.find((item) => matches(item, query)) ?? null;
    },
    async insert(item) {
      const items = await backend.read();
      items.push(item);
      await backend.write(items);
      return item;
    },
    async update(query, updates) {
      const items = await backend.read();
      let n = 0;
      for (const item of items) {
        if (matches(item, query)) {
          Object.assign(item as object, updates);
          n++;
        }
      }
      if (n > 0) await backend.write(items);
      return n;
    },
    async remove(query) {
      const items = await backend.read();
      const remaining = items.filter((item) => !matches(item, query));
      const n = items.length - remaining.length;
      if (n > 0) await backend.write(remaining);
      return n;
    },
    async count(query = {}) {
      const items = await backend.read();
      return items.filter((item) => matches(item, query)).length;
    },
  };
}
