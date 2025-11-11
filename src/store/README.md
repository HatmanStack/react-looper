# State Management

Comprehensive state management system using Zustand with persistence, migrations, and lifecycle handling.

## Overview

The Looper app uses **Zustand** for global state management with the following features:

- **Persistence**: State survives app restarts via localStorage/AsyncStorage
- **Migrations**: Schema versioning and automatic data migrations
- **Lifecycle**: Automatic state cleanup on background/foreground transitions
- **Performance**: Optimized selectors to minimize re-renders
- **DevTools**: Development tools for debugging and state inspection

## Store Architecture

### Three Main Stores

1. **Track Store** (`useTrackStore.ts`) - Track data management
2. **Playback Store** (`usePlaybackStore.ts`) - Playback state and settings
3. **UI Store** (`useUIStore.ts`) - UI state (modals, loading, errors)

### Store Diagram

```
┌─────────────────────────────────────────┐
│          UI Components                   │
└──────────────┬──────────────────────────┘
               │ (hooks)
┌──────────────▼──────────────────────────┐
│          Zustand Stores                  │
│  ┌────────────┬────────────┬─────────┐  │
│  │ TrackStore │ Playback   │ UI      │  │
│  │            │ Store      │ Store   │  │
│  └────────────┴────────────┴─────────┘  │
└──────────────┬──────────────────────────┘
               │ (persist middleware)
┌──────────────▼──────────────────────────┐
│      Platform Storage Adapter            │
│  ┌─────────────┬──────────────────────┐ │
│  │ Web:        │ Native:              │ │
│  │ localStorage│ AsyncStorage         │ │
│  └─────────────┴──────────────────────┘ │
└──────────────────────────────────────────┘
```

## Usage Examples

### Track Store

```typescript
import { useTrackStore } from './store/useTrackStore';
import { selectTracks, selectTrackById } from './store/selectors';

// In a component
function TrackList() {
  // Select only what you need to prevent re-renders
  const tracks = useTrackStore(selectTracks);
  const addTrack = useTrackStore((state) => state.addTrack);

  // Or get specific track
  const track = useTrackStore(selectTrackById('track-123'));

  return (
    <View>
      {tracks.map((track) => (
        <TrackItem key={track.id} track={track} />
      ))}
    </View>
  );
}
```

### Playback Store

```typescript
import { usePlaybackStore } from './store/usePlaybackStore';
import { selectTrackState, selectIsTrackPlaying } from './store/selectors';

function TrackControls({ trackId }) {
  // Select specific track state
  const trackState = usePlaybackStore(selectTrackState(trackId));
  const isPlaying = usePlaybackStore(selectIsTrackPlaying(trackId));

  const { setTrackPlaying, setTrackSpeed, setTrackVolume } =
    usePlaybackStore();

  return (
    <View>
      <Button
        onPress={() => setTrackPlaying(trackId, !isPlaying)}
        title={isPlaying ? 'Pause' : 'Play'}
      />
      <Slider
        value={trackState?.speed || 1.0}
        onValueChange={(speed) => setTrackSpeed(trackId, speed)}
      />
    </View>
  );
}
```

### UI Store

```typescript
import { useUIStore } from './store/useUIStore';
import { selectSaveModalVisible, selectIsMixing } from './store/selectors';

function MainScreen() {
  const saveModalVisible = useUIStore(selectSaveModalVisible);
  const { showSaveModal, hideSaveModal } = useUIStore();

  return (
    <View>
      <Button onPress={showSaveModal} title="Save" />
      <SaveModal visible={saveModalVisible} onDismiss={hideSaveModal} />
    </View>
  );
}
```

## State Persistence

### How It Works

State is automatically persisted to storage using Zustand's `persist` middleware:

- **Web**: Uses `localStorage`
- **Native**: Uses `@react-native-async-storage/async-storage`
- **Fallback**: In-memory storage if AsyncStorage unavailable

### What Gets Persisted

- **Track Store**: All track data
- **Playback Store**: Speed and volume settings (NOT playing state)
- **UI Store**: NOT persisted (transient UI state)

### Configuration

```typescript
// Example from useTrackStore.ts
export const useTrackStore = create<TrackStore>()(
  persist(
    (set, get) => ({
      /* store implementation */
    }),
    {
      name: "looper-tracks", // Storage key
      storage: createJSONStorage(() => createStorage()),
      partialize: (state) => ({
        tracks: state.tracks, // Only persist tracks
      }),
    },
  ),
);
```

## Data Migrations

### Versioning System

The migration system handles schema changes across app versions:

```typescript
// Define migrations in src/store/migrations/
export const trackMigrationConfig: MigrationConfig = {
  currentVersion: 2,
  migrations: {
    1: (state) => {
      // v1: Baseline
      return { tracks: state.tracks || [] };
    },
    2: (state) => {
      // v2: Add category field
      return {
        ...state,
        tracks: state.tracks.map((track) => ({
          ...track,
          category: track.category || "default",
        })),
      };
    },
  },
  validate: (state) => Array.isArray(state.tracks),
  defaultState: { tracks: [] },
};
```

### Adding a New Migration

1. Increment version number
2. Add migration function for new version
3. Update validation if needed
4. Test migration with old data

## App Lifecycle Handling

### Automatic Background Handling

The app automatically handles lifecycle events:

```typescript
import { useAppLifecycle } from './hooks/useAppLifecycle';

function App() {
  useAppLifecycle({
    onBackground: () => {
      // Automatically pauses all tracks
      // State is persisted via middleware
      console.log('App backgrounded');
    },
    onActive: () => {
      // State is restored automatically
      console.log('App foregrounded');
    },
  });

  return <YourApp />;
}
```

### Lifecycle Manager

For centralized lifecycle management:

```typescript
import { LifecycleManager } from "./services/lifecycle/LifecycleManager";

// In App initialization
const lifecycleManager = LifecycleManager.getInstance();
lifecycleManager.initialize({
  onAudioCleanup: () => {
    // Release audio resources
    audioService.cleanup();
  },
});
```

## Performance Optimization

### Use Selectors

Always use selectors to prevent unnecessary re-renders:

```typescript
// ❌ BAD: Re-renders on any store change
const { tracks, addTrack, removeTrack } = useTrackStore();

// ✅ GOOD: Only re-renders when tracks change
const tracks = useTrackStore((state) => state.tracks);
const addTrack = useTrackStore((state) => state.addTrack);

// ✅ BETTER: Use predefined selectors
import { selectTracks } from "./store/selectors";
const tracks = useTrackStore(selectTracks);
```

### Selector Reference

All selectors are defined in `src/store/selectors.ts`:

- `selectTracks` - All tracks
- `selectTrackById(id)` - Specific track
- `selectTrackIds` - Just IDs (for lists)
- `selectTrackState(trackId)` - Playback state
- `selectIsTrackPlaying(trackId)` - Playing status
- `selectIsAnyPlaying` - Any track playing
- And more...

## Development Tools

### Enable State Logging

```typescript
import { enableStateLogging } from "./store/devtools";

// In development
if (__DEV__) {
  enableStateLogging();
}
```

### Export/Import State

```typescript
import { exportState, importState } from "./store/devtools";

// Export current state
const snapshot = exportState();

// Import state (for testing)
importState(snapshot);
```

### Reset All Stores

```typescript
import { resetAllStores } from "./store/devtools";

// Reset to initial state
resetAllStores();
```

### Get Statistics

```typescript
import { getStoreStats } from "./store/devtools";

const stats = getStoreStats();
console.log(stats);
// {
//   tracks: { count: 5, playingCount: 2 },
//   playback: { trackedCount: 5, playingCount: 2 },
//   ui: { modalsOpen: 0, activeOperations: 0 }
// }
```

## Testing

### Unit Tests

All stores have comprehensive unit tests:

```bash
npm test __tests__/unit/store/
```

### Test Files

- `useTrackStore.test.ts` - Track CRUD operations
- `usePlaybackStore.test.ts` - Playback state management
- `useUIStore.test.ts` - UI state transitions
- `persistence.test.ts` - Storage adapter tests
- `migrations.test.ts` - Migration system tests
- `useAppLifecycle.test.ts` - Lifecycle handling tests

### Testing with Stores

```typescript
import { useTrackStore } from "../src/store/useTrackStore";

describe("MyComponent", () => {
  beforeEach(() => {
    // Reset store before each test
    useTrackStore.getState().clearTracks();
  });

  it("should add track", () => {
    const { addTrack } = useTrackStore.getState();
    addTrack(mockTrack);

    expect(useTrackStore.getState().tracks).toHaveLength(1);
  });
});
```

## Best Practices

### 1. Keep Stores Focused

Each store should manage a single domain:

- ✅ TrackStore manages track data only
- ✅ PlaybackStore manages playback state only
- ❌ Don't mix unrelated concerns in one store

### 2. Immutable Updates

Always return new objects/arrays:

```typescript
// ✅ GOOD
addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] }));

// ❌ BAD
addTrack: (track) =>
  set((state) => {
    state.tracks.push(track); // Mutation!
    return state;
  });
```

### 3. Use Actions, Not Direct State

```typescript
// ✅ GOOD
const addTrack = useTrackStore((state) => state.addTrack);
addTrack(newTrack);

// ❌ BAD
useTrackStore.setState({ tracks: [...tracks, newTrack] });
```

### 4. Selective Persistence

Only persist what's necessary:

```typescript
partialize: (state) => ({
  tracks: state.tracks, // Persist
  // Don't persist derived state or transient UI
});
```

### 5. Validate on Hydration

Always validate persisted data:

```typescript
validate: (state) => {
  return state && Array.isArray(state.tracks);
};
```

## Troubleshooting

### State Not Persisting

1. Check storage adapter is working
2. Verify `partialize` includes the field
3. Check for serialization errors (Map/Set need custom serializers)

### Re-render Issues

1. Use selectors to select only needed state
2. Check if derived state should be memoized
3. Verify actions aren't recreated on each render

### Migration Failures

1. Check console for migration errors
2. Verify migration functions are idempotent
3. Test with actual persisted data from older versions

## File Structure

```
src/store/
├── README.md                  ← You are here
├── useTrackStore.ts          ← Track data store
├── usePlaybackStore.ts       ← Playback state store
├── useUIStore.ts             ← UI state store
├── storage.ts                ← Platform storage adapter
├── selectors.ts              ← Performance-optimized selectors
├── devtools.ts               ← Development debugging tools
└── migrations/               ← Migration system
    ├── types.ts              ← Migration type definitions
    ├── migrationSystem.ts    ← Core migration logic
    └── trackMigrations.ts    ← Track-specific migrations
```

## Further Reading

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- Phase 0 ADR-005: State Management Strategy
