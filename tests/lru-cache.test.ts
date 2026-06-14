import assert from "assert/strict";
import { LRUCache } from "../src/utils/lru-cache";

function test(name: string, run: () => void) {
    run();
    console.log(`ok - ${name}`);
}

test("evicts the least recently used entry", () => {
    const cache = new LRUCache<string, number>(2);

    cache.set("one", 1);
    cache.set("two", 2);
    assert.equal(cache.get("one"), 1);

    cache.set("three", 3);

    assert.equal(cache.get("two"), null);
    assert.equal(cache.get("one"), 1);
    assert.equal(cache.get("three"), 3);
});

test("does not cache entries when max size is zero", () => {
    const cache = new LRUCache<string, number>(0);

    cache.set("one", 1);

    assert.equal(cache.get("one"), null);
});
