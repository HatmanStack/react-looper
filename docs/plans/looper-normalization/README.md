# Looper Track Normalization Feature

## Feature Overview

This feature transforms the audio mixing application into a true looper machine that matches the behavior of professional hardware loopers (Boss Loop Station, TC Ditto, etc.). Currently, the application treats all tracks independently and mixes them based on the longest track duration. The new looper normalization feature introduces a **master loop track** concept where the first track's speed-adjusted duration sets the loop length, and all subsequent tracks automatically loop to match this duration.

This change provides a more intuitive and musical workflow for users creating layered loops. When a user records or imports the first track, that track becomes the master loop. All subsequent tracks will seamlessly repeat to fill the master loop duration, enabling the creation of complex, layered musical loops with different length phrases that interlock naturally. For example, a user could lay down an 8-second drum pattern as the master loop, then add a 4-second bass line that repeats twice per drum cycle, and a 16-second melody that spans two drum cycles by being trimmed appropriately.

The feature includes comprehensive UI updates to clearly indicate the master track, a global loop mode toggle for preview, confirmation dialogs to prevent accidental disruption of the loop structure, and an enhanced save dialog that allows users to export multiple loop repetitions with configurable fadeout. A new settings page provides control over advanced options like loop crossfade timing and default export preferences.

## Prerequisites

Before starting implementation, ensure:

- **Node.js v18+** and npm are installed
- **Development environment** is set up (see repo README.md)
- **Familiarity with**:
  - React Native and Expo
  - Zustand state management
  - TypeScript
  - Web Audio API and expo-av
  - Audio mixing concepts (playback rate, looping, synchronization)
- **Testing framework** knowledge (Jest, React Native Testing Library)
- All existing tests passing (`npm test`)
- Application builds successfully (`npm run web` for web, `npm start` for mobile)

## Phase Summary

| Phase       | Goal                                         | Est. Tokens     |
| ----------- | -------------------------------------------- | --------------- |
| **Phase 0** | Foundation - Architecture & Design Decisions | N/A (Reference) |
| **Phase 1** | Core Looping Engine & State Management       | ~85,000         |
| **Phase 2** | UI Components & Visual Indicators            | ~90,000         |
| **Phase 3** | Settings Page & Configuration                | ~75,000         |
| **Phase 4** | Save/Export Enhancements                     | ~80,000         |
| **Phase 5** | Recording Workflow Integration               | ~70,000         |
| **Total**   |                                              | ~400,000        |

## Implementation Order

1. **Phase 0**: Review foundation document for architecture decisions and patterns
2. **Phase 1**: Implement core looping logic and update stores
3. **Phase 2**: Build UI components for master track indication and loop mode toggle
4. **Phase 3**: Create settings page with looper-specific configuration
5. **Phase 4**: Enhance save/export with loop repetition and fadeout
6. **Phase 5**: Update recording workflow to auto-stop at loop boundaries

## Navigation

- [Phase 0: Foundation](./Phase-0.md) - Architecture & Design Decisions
- [Phase 1: Core Looping Engine](./Phase-1.md) - State Management & Loop Calculation
- [Phase 2: UI Components](./Phase-2.md) - Master Track Indicators & Loop Toggle
- [Phase 3: Settings Page](./Phase-3.md) - Configuration & Preferences
- [Phase 4: Save/Export](./Phase-4.md) - Loop Repetition & Fadeout
- [Phase 5: Recording Workflow](./Phase-5.md) - Auto-Stop & Master Loop Creation

## Key User-Facing Changes

### For End Users

- First track automatically becomes the master loop length
- All subsequent tracks loop seamlessly to match master duration
- Clear visual indication of which track is the master
- Global "Loop Mode" toggle to preview looping behavior during playback
- Enhanced save dialog with loop count and fadeout configuration
- Confirmation dialogs when changing master track speed or deleting master track
- Per-track playback position indicators
- Settings page for advanced looping preferences

### For Developers

- New `LoopEngine` service for calculating loop boundaries and repetitions
- Extended store interfaces with master track tracking and loop mode state
- Reusable confirmation dialog component
- Settings persistence layer
- Updated mixer implementations to handle track repetition
- Enhanced audio player interfaces for loop boundary callbacks

## Testing Strategy

Each phase includes:

- **Unit tests** for all new utility functions and services
- **Integration tests** for store interactions and state changes
- **Component tests** for UI elements and user interactions
- **E2E scenarios** for critical user workflows (record → add track → save)

Target: **80%+ code coverage** for new code

## Success Criteria

✅ First track sets master loop duration (speed-adjusted)
✅ Subsequent tracks loop seamlessly to match master duration
✅ Master track has distinct visual styling
✅ Global loop toggle functions correctly in playback
✅ Changing master track speed shows confirmation and updates all tracks
✅ Deleting master track shows confirmation and clears all tracks
✅ Save dialog allows configuring loop count and fadeout
✅ Recording auto-stops at loop boundary for subsequent tracks
✅ Settings page persists user preferences
✅ All existing tests pass
✅ No performance regression in mixing or playback

## Risk Mitigation

**Risk**: Breaking existing user sessions or saved tracks
**Mitigation**: Store migration system to handle legacy data gracefully

**Risk**: Audio sync issues with looping tracks
**Mitigation**: Thorough testing on web and mobile platforms, use existing sync mechanisms

**Risk**: Performance degradation with many short loops
**Mitigation**: Efficient loop calculation caching, benchmark before/after

**Risk**: User confusion from behavior change
**Mitigation**: Clear UI indicators, in-app help updates, optional migration guide

**Risk**: Native mixer implementation incomplete for loop export
**Status**: Phase 4, Task 4 documents FFmpeg approach but may be implemented as placeholder
**Impact**: Loop repetition and fadeout in exported audio may only work on web initially
**Mitigation**: Implementation guide provided in Phase-4.md; web implementation serves as reference; native can be completed in follow-up work

## Notes for Implementation

- Follow existing code patterns (see Phase-0 for details)
- Use conventional commits for all changes
- Write tests BEFORE implementation (TDD approach)
- Commit frequently with atomic changes
- Keep each task focused and single-purpose
- Defer optimizations until feature is working correctly
- Document any deviations from the plan with justification
