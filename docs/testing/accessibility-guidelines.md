# Accessibility Guidelines

## Overview

The Looper application aims to meet WCAG 2.1 Level AA accessibility standards across all platforms (web, iOS, Android).

## Accessibility Principles (WCAG)

### 1. Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

### 2. Operable

User interface components and navigation must be operable.

### 3. Understandable

Information and the operation of the user interface must be understandable.

### 4. Robust

Content must be robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies.

## Implementation Checklist

### Text Alternatives

- [ ] All images have alt text
- [ ] Icons have accessible labels
- [ ] Audio content has text descriptions
- [ ] Form inputs have labels

**Implementation:**

```tsx
// Good: Image with alt text
<Image source={icon} accessibilityLabel="Record audio" />

// Good: Button with label
<Button
  onPress={handleRecord}
  accessibilityLabel="Start recording"
  accessibilityHint="Tap to begin recording audio"
>
  <Icon name="microphone" />
</Button>

// Good: Form input with label
<TextInput
  accessibilityLabel="Track name"
  accessibilityHint="Enter a name for this track"
  value={trackName}
  onChangeText={setTrackName}
/>
```

### Color Contrast

- [ ] Text has 4.5:1 contrast ratio minimum
- [ ] Large text (18pt+) has 3:1 contrast ratio
- [ ] Interactive elements have 3:1 contrast ratio
- [ ] Test in both light and dark themes

**Testing Tools:**

- WebAIM Contrast Checker
- Chrome DevTools Accessibility Panel
- Lighthouse Accessibility Audit

**Current Theme Colors:**

```typescript
// Verify these meet contrast requirements
const colors = {
  primary: "#6200EE", // Purple - check against white/light backgrounds
  background: "#FFFFFF", // White
  text: "#000000", // Black - 21:1 ratio ✓
  disabled: "#9E9E9E", // Gray - check ratio
  error: "#B00020", // Red - check against white
};
```

### Keyboard Navigation (Web)

- [ ] All interactive elements focusable
- [ ] Logical tab order
- [ ] Visible focus indicators
- [ ] Skip navigation links
- [ ] Keyboard shortcuts documented

**Implementation:**

```tsx
// Focus indicator styles
const styles = StyleSheet.create({
  button: {
    // ... base styles
  },
  buttonFocused: {
    borderWidth: 2,
    borderColor: "#6200EE",
    outlineWidth: 2, // Web only
    outlineColor: "#6200EE",
  },
});

// Usage
<Pressable
  style={({ focused }) => [styles.button, focused && styles.buttonFocused]}
  accessibilityRole="button"
/>;
```

### Touch Targets

- [ ] Minimum 44x44 points (iOS) / 48x48 dp (Android)
- [ ] Adequate spacing between targets
- [ ] Easy to tap accurately

**Implementation:**

```tsx
// Ensure minimum hit area
<Pressable
  onPress={handlePress}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  style={{
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  }}
>
  <Icon size={24} />
</Pressable>
```

### Screen Reader Support

#### iOS VoiceOver

- [ ] All elements have labels
- [ ] Traits correctly set (button, header, etc.)
- [ ] Hints provide context
- [ ] Navigation order logical
- [ ] Dynamic content announces changes

**Testing:**

1. Enable VoiceOver: Settings → Accessibility → VoiceOver
2. Navigate using swipe gestures
3. Activate elements with double-tap
4. Verify all content is announced

#### Android TalkBack

- [ ] Content descriptions present
- [ ] Roles correctly assigned
- [ ] Hints helpful but not verbose
- [ ] Navigation follows visual order

**Testing:**

1. Enable TalkBack: Settings → Accessibility → TalkBack
2. Navigate using swipe gestures
3. Activate with double-tap
4. Verify announcements

#### Web Screen Readers

- [ ] Semantic HTML where possible
- [ ] ARIA labels and roles
- [ ] Live regions for dynamic content
- [ ] Landmarks for page structure

**Supported:**

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- ChromeVox (Chrome OS)

### Accessibility Properties Reference

```tsx
// React Native Accessibility Props
<View
  accessible={true} // Groups children as single element
  accessibilityLabel="Main controls" // What element is
  accessibilityHint="Record and playback" // What it does
  accessibilityRole="toolbar" // Semantic role
  accessibilityState={{ disabled: false }} // Current state
  accessibilityValue={{ text: "75%" }} // Current value (sliders, etc.)
  accessibilityActions={[
    // Custom actions
    { name: "activate", label: "Start recording" },
  ]}
  onAccessibilityAction={(event) => {
    if (event.nativeEvent.actionName === "activate") {
      handleRecord();
    }
  }}
/>
```

## Common Components

### Buttons

```tsx
<Button
  accessibilityLabel="Record audio"
  accessibilityHint="Tap to start recording"
  accessibilityRole="button"
  accessibilityState={{ disabled: isRecording }}
>
  Record
</Button>
```

### Sliders

```tsx
<Slider
  value={speed}
  minimumValue={0.05}
  maximumValue={2.5}
  accessibilityLabel="Playback speed"
  accessibilityValue={{ text: `${speed.toFixed(2)}x` }}
  accessibilityHint="Adjust playback speed"
  onValueChange={setSpeed}
/>
```

### Track List Items

```tsx
<Pressable
  accessibilityLabel={`Track: ${track.name}`}
  accessibilityHint="Double tap to play or pause"
  accessibilityRole="button"
  accessibilityState={{ selected: isPlaying }}
>
  <TrackListItem track={track} />
</Pressable>
```

### Modals

```tsx
<Modal
  visible={visible}
  accessibilityViewIsModal={true} // Trap focus in modal
  onRequestClose={onClose}
>
  <View accessibilityRole="dialog">
    <Text accessibilityRole="header">Save Audio</Text>
    {/* Modal content */}
  </View>
</Modal>
```

## Testing Tools

### Automated Testing

```bash
# Install accessibility linter
npm install --save-dev @react-native-community/eslint-plugin-react-native-a11y

# Add to .eslintrc.js
{
  "plugins": ["react-native-a11y"],
  "extends": ["plugin:react-native-a11y/all"]
}
```

### Manual Testing

**iOS:**

1. Settings → Accessibility → VoiceOver → ON
2. Settings → Accessibility → Display & Text Size → Larger Text
3. Settings → Accessibility → Display & Text Size → Increase Contrast

**Android:**

1. Settings → Accessibility → TalkBack → ON
2. Settings → Accessibility → Text and display → Font size
3. Settings → Accessibility → Color and motion → High contrast text

**Web:**

1. Browser DevTools → Lighthouse → Accessibility Audit
2. axe DevTools browser extension
3. Keyboard-only navigation test

## Common Issues and Fixes

### Issue: Button not announced by screen reader

**Fix:** Add accessibilityLabel

```tsx
// Before
<Pressable onPress={handleRecord}>
  <Icon name="microphone" />
</Pressable>

// After
<Pressable
  onPress={handleRecord}
  accessibilityLabel="Record audio"
>
  <Icon name="microphone" />
</Pressable>
```

### Issue: Slider value not announced

**Fix:** Add accessibilityValue

```tsx
// Before
<Slider value={volume} onValueChange={setVolume} />

// After
<Slider
  value={volume}
  onValueChange={setVolume}
  accessibilityLabel="Volume"
  accessibilityValue={{ text: `${volume}%` }}
/>
```

### Issue: Color-only distinction

**Fix:** Add text label or icon

```tsx
// Before (playing status only by color)
<View style={{ backgroundColor: isPlaying ? 'green' : 'gray' }} />

// After (icon + color)
<View style={{ backgroundColor: isPlaying ? 'green' : 'gray' }}>
  <Icon name={isPlaying ? 'play' : 'pause'} />
  <Text>{isPlaying ? 'Playing' : 'Paused'}</Text>
</View>
```

## Accessibility Audit Checklist

Before each release:

- [ ] Run automated accessibility tests
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Test with web screen reader (NVDA/JAWS)
- [ ] Test keyboard navigation (web)
- [ ] Verify color contrast ratios
- [ ] Test with large text sizes
- [ ] Test with high contrast mode
- [ ] Verify touch target sizes
- [ ] Review focus indicators

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
- [WebAIM Resources](https://webaim.org/resources/)
- [a11y Project](https://www.a11yproject.com/)
