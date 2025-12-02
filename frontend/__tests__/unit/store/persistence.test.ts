/**
 * State Persistence Tests
 *
 * Tests for Zustand persistence middleware integration
 */

import { createStorage, serializers } from "../../../src/store/storage";

describe("Storage Adapter", () => {
  let storage: ReturnType<typeof createStorage>;

  beforeEach(() => {
    storage = createStorage();
    // Clear any existing data
    storage.removeItem("test-key");
  });

  it("should store and retrieve string values", async () => {
    await storage.setItem("test-key", "test-value");
    const retrieved = await storage.getItem("test-key");

    expect(retrieved).toBe("test-value");
  });

  it("should store and retrieve JSON values", async () => {
    const testData = { foo: "bar", num: 42, nested: { value: true } };
    await storage.setItem("test-key", JSON.stringify(testData));

    const retrieved = await storage.getItem("test-key");
    expect(JSON.parse(retrieved!)).toEqual(testData);
  });

  it("should return null for non-existent keys", async () => {
    const retrieved = await storage.getItem("non-existent");
    expect(retrieved).toBeNull();
  });

  it("should remove items", async () => {
    await storage.setItem("test-key", "test-value");
    expect(await storage.getItem("test-key")).toBe("test-value");

    await storage.removeItem("test-key");
    expect(await storage.getItem("test-key")).toBeNull();
  });

  it("should handle concurrent operations", async () => {
    const operations = [];

    for (let i = 0; i < 10; i++) {
      operations.push(storage.setItem(`key-${i}`, `value-${i}`));
    }

    await Promise.all(operations);

    for (let i = 0; i < 10; i++) {
      const value = await storage.getItem(`key-${i}`);
      expect(value).toBe(`value-${i}`);
    }
  });
});

describe("Serialization Helpers", () => {
  describe("Map serialization", () => {
    it("should serialize Map to array", () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
        ["key3", "value3"],
      ]);

      const serialized = serializers.serializeMap(map);

      expect(Array.isArray(serialized)).toBe(true);
      expect(serialized).toEqual([
        ["key1", "value1"],
        ["key2", "value2"],
        ["key3", "value3"],
      ]);
    });

    it("should deserialize array to Map", () => {
      const array: Array<[string, string]> = [
        ["key1", "value1"],
        ["key2", "value2"],
      ];

      const deserialized = serializers.deserializeMap(array);

      expect(deserialized instanceof Map).toBe(true);
      expect(deserialized.get("key1")).toBe("value1");
      expect(deserialized.get("key2")).toBe("value2");
      expect(deserialized.size).toBe(2);
    });

    it("should handle empty Map", () => {
      const map = new Map();
      const serialized = serializers.serializeMap(map);
      const deserialized = serializers.deserializeMap(serialized);

      expect(serialized).toEqual([]);
      expect(deserialized.size).toBe(0);
    });

    it("should handle Map with complex values", () => {
      const map = new Map([
        ["track1", { speed: 1.5, volume: 75, isPlaying: false }],
        ["track2", { speed: 2.0, volume: 50, isPlaying: true }],
      ]);

      const serialized = serializers.serializeMap(map);
      const deserialized = serializers.deserializeMap(serialized);

      expect(deserialized.get("track1")).toEqual({
        speed: 1.5,
        volume: 75,
        isPlaying: false,
      });
      expect(deserialized.get("track2")).toEqual({
        speed: 2.0,
        volume: 50,
        isPlaying: true,
      });
    });
  });

  describe("Set serialization", () => {
    it("should serialize Set to array", () => {
      const set = new Set(["value1", "value2", "value3"]);

      const serialized = serializers.serializeSet(set);

      expect(Array.isArray(serialized)).toBe(true);
      expect(serialized).toContain("value1");
      expect(serialized).toContain("value2");
      expect(serialized).toContain("value3");
      expect(serialized.length).toBe(3);
    });

    it("should deserialize array to Set", () => {
      const array = ["value1", "value2", "value3"];

      const deserialized = serializers.deserializeSet(array);

      expect(deserialized instanceof Set).toBe(true);
      expect(deserialized.has("value1")).toBe(true);
      expect(deserialized.has("value2")).toBe(true);
      expect(deserialized.has("value3")).toBe(true);
      expect(deserialized.size).toBe(3);
    });

    it("should handle empty Set", () => {
      const set = new Set();
      const serialized = serializers.serializeSet(set);
      const deserialized = serializers.deserializeSet(serialized);

      expect(serialized).toEqual([]);
      expect(deserialized.size).toBe(0);
    });

    it("should preserve uniqueness when deserializing", () => {
      const array = ["value1", "value2", "value1", "value3", "value2"];

      const deserialized = serializers.deserializeSet(array);

      expect(deserialized.size).toBe(3);
      expect(deserialized.has("value1")).toBe(true);
      expect(deserialized.has("value2")).toBe(true);
      expect(deserialized.has("value3")).toBe(true);
    });
  });

  describe("Round-trip serialization", () => {
    it("should maintain Map integrity through serialize/deserialize", () => {
      const originalMap = new Map([
        ["id1", { name: "Track 1", value: 100 }],
        ["id2", { name: "Track 2", value: 200 }],
        ["id3", { name: "Track 3", value: 300 }],
      ]);

      const serialized = serializers.serializeMap(originalMap);
      const deserialized = serializers.deserializeMap(serialized);

      expect(deserialized).toEqual(originalMap);
    });

    it("should maintain Set integrity through serialize/deserialize", () => {
      const originalSet = new Set(["track-1", "track-2", "track-3"]);

      const serialized = serializers.serializeSet(originalSet);
      const deserialized = serializers.deserializeSet(serialized);

      expect(deserialized).toEqual(originalSet);
    });
  });
});

describe("Persistence Integration", () => {
  it("should persist and restore Map using storage", async () => {
    const storage = createStorage();
    const map = new Map([
      ["key1", "value1"],
      ["key2", "value2"],
    ]);

    // Serialize and store
    const serialized = serializers.serializeMap(map);
    await storage.setItem("test-map", JSON.stringify(serialized));

    // Retrieve and deserialize
    const retrieved = await storage.getItem("test-map");
    const deserialized = serializers.deserializeMap(JSON.parse(retrieved!));

    expect(deserialized).toEqual(map);

    // Cleanup
    await storage.removeItem("test-map");
  });

  it("should persist and restore Set using storage", async () => {
    const storage = createStorage();
    const set = new Set(["item1", "item2", "item3"]);

    // Serialize and store
    const serialized = serializers.serializeSet(set);
    await storage.setItem("test-set", JSON.stringify(serialized));

    // Retrieve and deserialize
    const retrieved = await storage.getItem("test-set");
    const deserialized = serializers.deserializeSet(JSON.parse(retrieved!));

    expect(deserialized).toEqual(set);

    // Cleanup
    await storage.removeItem("test-set");
  });

  it("should persist complex state structure", async () => {
    const storage = createStorage();

    const state = {
      tracks: [
        { id: "1", name: "Track 1", speed: 1.5 },
        { id: "2", name: "Track 2", speed: 2.0 },
      ],
      settings: serializers.serializeMap(
        new Map([
          ["track-1", { volume: 75, speed: 1.5 }],
          ["track-2", { volume: 50, speed: 2.0 }],
        ]),
      ),
    };

    await storage.setItem("app-state", JSON.stringify(state));

    const retrieved = await storage.getItem("app-state");
    const parsed = JSON.parse(retrieved!);

    expect(parsed.tracks).toEqual(state.tracks);
    expect(serializers.deserializeMap(parsed.settings)).toEqual(
      serializers.deserializeMap(state.settings),
    );

    // Cleanup
    await storage.removeItem("app-state");
  });
});
