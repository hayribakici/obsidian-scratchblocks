export class LRUCache<K, V> {
  private entries = new Map<K, V>();

  constructor(private readonly maxEntries: number) {}

  get(key: K): V | null {
    if (!this.entries.has(key)) {
      return null;
    }

    const value = this.entries.get(key) as V;

    this.entries.delete(key);
    this.entries.set(key, value);

    return value;
  }

  set(key: K, value: V) {
    if (this.maxEntries <= 0) {
      return;
    }

    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next();

      if (!oldest.done) {
        this.entries.delete(oldest.value);
      }
    }

    this.entries.set(key, value);
  }
}
