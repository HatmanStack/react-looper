# Components

This directory contains reusable UI components for the Looper application.

## Organization

Components should be organized by feature or type:

- Each component should have its own directory
- Use PascalCase for component names
- Include component file, styles (if separate), and tests

## Example Structure

```
components/
├── TrackListItem/
│   ├── TrackListItem.tsx
│   ├── TrackListItem.styles.ts
│   └── TrackListItem.test.tsx
├── Button/
│   ├── Button.tsx
│   └── Button.test.tsx
└── index.ts (barrel exports)
```

## Guidelines

- Components should be functional components using React Hooks
- Use TypeScript for type safety
- Follow React Native Paper patterns where applicable
- Keep components focused and composable
