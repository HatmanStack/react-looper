# Track Sync Speed

## Overview

This feature adds a "sync to master" capability that lets users lock a non-master track's playback speed so its effective duration aligns with the master loop duration at a chosen multiplier. The base sync speed is calculated as `track.duration / masterLoopDuration`, and the user selects from seven multipliers (1/4x, 1/3x, 1/2x, 1x, 2x, 3x, 4x) where 1x means "play at exactly the master loop duration."

Sync is a persistent binding: when the master track's speed changes (altering the master loop duration), all synced tracks automatically recalculate their speeds. The binding breaks when the user manually drags the speed slider, reverting the track to manual mode with no residual indicator.

The UI consists of a sync icon button on each non-master track that opens a popover menu (React Native Paper `Menu`) listing the available multipliers. Multipliers that would produce a speed outside the valid 0.05-2.50 range are hidden.

## Prerequisites

- Node v24 LTS (nvm)
- Project dependencies installed: `npm install` from repo root
- Familiarity with Zustand stores, React Native Paper components, and the project's path alias system

## Phase Summary

| Phase | Goal | Token Estimate |
|-------|------|----------------|
| 0 | Foundation: architecture decisions, patterns, testing strategy | ~3,000 |
| 1 | Implementation: types, utils, store logic, hook, UI, tests | ~45,000 |

## Navigation

- [Phase-0.md](./Phase-0.md) - Foundation and design decisions
- [Phase-1.md](./Phase-1.md) - Full implementation
- [feedback.md](./feedback.md) - Review feedback tracking
