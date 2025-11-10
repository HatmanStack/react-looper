# Services

This directory contains business logic and external service integrations.

## Organization

Services handle:

- Audio recording and playback
- File management
- FFmpeg integration
- Platform-specific implementations

## Patterns

### Platform-Specific Services

Use platform extensions for platform-specific code:

- `AudioRecorder.ts` - Interface/base class
- `AudioRecorder.web.ts` - Web implementation
- `AudioRecorder.native.ts` - Native implementation

### Service Structure

```typescript
// Base interface
export interface IAudioRecorder {
  startRecording(): Promise<void>;
  stopRecording(): Promise<string>;
}

// Platform-specific implementation
export class WebAudioRecorder implements IAudioRecorder {
  // Implementation
}
```

## Guidelines

- Services should be stateless when possible
- Use dependency injection for testability
- Follow single responsibility principle
- Handle errors gracefully with typed error responses
