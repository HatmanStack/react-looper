# App Store Assets Guide

This directory contains all assets needed for app store submissions (Google Play Store, Apple App Store, and web).

## Directory Structure

```
assets/store/
├── android/          # Android-specific assets
│   ├── feature-graphic.png
│   ├── icon-512.png
│   └── screenshots/
├── ios/              # iOS-specific assets
│   ├── icon-1024.png
│   └── screenshots/
├── web/              # Web PWA icons
│   └── icons/
└── screenshots/      # Shared screenshots
```

## Android Assets (Google Play Store)

### App Icon

- **File**: `android/icon-512.png`
- **Size**: 512x512 pixels
- **Format**: 32-bit PNG with alpha
- **Notes**: High-resolution icon for Play Store listing

### Feature Graphic

- **File**: `android/feature-graphic.png`
- **Size**: 1024x500 pixels
- **Format**: JPG or 24-bit PNG (no alpha)
- **Notes**: Displayed at the top of app listing

### Screenshots

Required sizes for different devices:

**Phone (Required)**:

- Min: 320px
- Max: 3840px
- Recommended: 1080x1920 (portrait) or 1920x1080 (landscape)
- Format: JPG or 24-bit PNG
- Quantity: 2-8 screenshots

**7-inch Tablet (Optional)**:

- Same requirements as phone

**10-inch Tablet (Optional)**:

- Same requirements as phone

### Promo Video (Optional)

- YouTube URL for app preview video
- 30 seconds to 2 minutes

## iOS Assets (Apple App Store)

### App Icon

- **File**: `ios/icon-1024.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG without alpha channel
- **Notes**: Required for App Store submission

### Screenshots

**iPhone 6.7" (iPhone 14/15 Pro Max)**:

- Size: 1290x2796 pixels (portrait) or 2796x1290 (landscape)
- Format: JPG or PNG
- Quantity: 1-10 screenshots
- **Required**

**iPhone 6.5" (iPhone 11 Pro Max, iPhone XS Max)**:

- Size: 1242x2688 pixels (portrait) or 2688x1242 (landscape)
- Format: JPG or PNG
- Quantity: 1-10 screenshots
- Required if 6.7" not provided

**iPhone 5.5" (iPhone 8 Plus)**:

- Size: 1242x2208 pixels (portrait) or 2208x1242 (landscape)
- Format: JPG or PNG
- Quantity: 1-10 screenshots
- Required for older devices

**iPad Pro 12.9" (Optional)**:

- Size: 2048x2732 pixels (portrait) or 2732x2048 (landscape)
- Format: JPG or PNG
- Quantity: 1-10 screenshots

### App Preview Videos (Optional)

- Format: M4V, MP4, or MOV
- Resolution: 1080p or 4K
- Duration: 15-30 seconds
- Same sizes as screenshots

## Web Assets (PWA)

### Icons

Required sizes (already configured in `public/manifest.json`):

- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

All PNG format with transparency support.

### Screenshots

**Desktop**:

- Size: 1920x1080 pixels
- Format: PNG or JPG
- Purpose: Shown in browser install prompts

**Mobile**:

- Size: 750x1334 pixels
- Format: PNG or JPG
- Purpose: Shown in mobile browsers

## Store Listings Text

### App Name

**Primary**: "Looper"
**Subtitle/Short Description**: "Audio Mixing & Looping"

### Short Description (80 characters - Google Play)

"Record, import, and mix audio tracks with independent speed and volume controls"

### Full Description

```
Looper is a powerful audio mixing application that lets you:

✓ Record audio directly in the app
✓ Import audio files from your device
✓ Play multiple tracks simultaneously
✓ Adjust playback speed (0.05x - 2.50x) independently per track
✓ Control volume (0-100) independently per track
✓ Loop all tracks continuously
✓ Mix multiple tracks into a single audio file
✓ Export mixed audio accounting for all speed and volume adjustments

Perfect for musicians, podcasters, DJs, and audio enthusiasts who want to layer and mix audio tracks with precise control.

Key Features:
- Multi-track recording and playback
- True audio mixing with FFmpeg
- Independent speed and volume controls
- High-quality audio processing
- Simple, intuitive Material Design interface
- Works offline - no internet required
- Cross-platform (Web, Android, iOS)

Whether you're creating loops for practice, mixing podcast episodes, or layering instrumental tracks, Looper gives you the tools you need for professional-quality audio mixing.
```

### Keywords (App Store - 100 characters max)

"audio,mixer,looper,music,recording,podcast,multitrack,ffmpeg,mixing,loop"

### Category

- **Google Play**: Music & Audio
- **App Store**: Music
- **Web**: Music, Audio, Productivity

### Content Rating

- **Google Play**: Everyone
- **App Store**: 4+
- **Description**: No objectionable content

## Privacy Policy

A privacy policy is required for app store submissions. Key points:

- App does not collect personal data
- Audio recordings stay on device (not uploaded)
- No analytics or tracking (unless enabled)
- Microphone permission used only for recording
- Storage permission used only for saving/importing audio

**URL**: `https://looper.app/privacy-policy`

## Support Information

- **Support Email**: support@looper.app
- **Website**: https://looper.app
- **Support URL**: https://looper.app/support

## Creating Screenshots

### Recommended Tools

- **Android**: Use Android emulator or device with screenshot tool
- **iOS**: Use iOS simulator or device (Cmd+S for simulator screenshots)
- **Web**: Use browser DevTools device mode, then screenshot

### Screenshot Guidelines

1. **Show key features**: Recording, importing, mixing, playback
2. **Highlight unique features**: Independent speed/volume, true mixing
3. **Use realistic content**: Add sample tracks, show UI in use
4. **Keep UI clean**: Hide debug info, use production build
5. **Add captions**: Explain what's shown in each screenshot
6. **Show before/after**: Demonstrate mixing process

### Screenshot Ideas

1. **Main screen** with multiple tracks loaded
2. **Recording interface** showing microphone active
3. **Playback controls** with sliders adjusted
4. **Mixing modal** showing progress
5. **Mixed audio** ready for export
6. **Import interface** selecting files
7. **Settings/about** screen
8. **Multi-track playback** with all tracks playing

## Generating Icons

If you need to generate icons from a source image:

```bash
# Install imagemagick
brew install imagemagick  # macOS
sudo apt install imagemagick  # Linux

# Generate Android icon
convert source-icon.png -resize 512x512 android/icon-512.png

# Generate iOS icon
convert source-icon.png -resize 1024x1024 ios/icon-1024.png

# Generate PWA icons
for size in 72 96 128 144 152 192 384 512; do
  convert source-icon.png -resize ${size}x${size} web/icons/icon-${size}x${size}.png
done
```

## Asset Checklist

Before submission, ensure you have:

### Android (Google Play)

- [ ] 512x512 app icon
- [ ] 1024x500 feature graphic
- [ ] 2-8 phone screenshots (1080x1920)
- [ ] Short description (80 chars)
- [ ] Full description
- [ ] Privacy policy URL
- [ ] Support email

### iOS (App Store)

- [ ] 1024x1024 app icon
- [ ] 6.7" iPhone screenshots (1290x2796) - 1-10 images
- [ ] 5.5" iPhone screenshots (1242x2208) - 1-10 images
- [ ] App description
- [ ] Keywords (100 chars)
- [ ] Privacy policy URL
- [ ] Support URL

### Web (PWA)

- [ ] PWA icons (72px to 512px)
- [ ] Desktop screenshot (1920x1080)
- [ ] Mobile screenshot (750x1334)
- [ ] Manifest.json configured

## Notes

- All assets should be high quality, professional-looking images
- Screenshots should show the app in use, not empty states
- Follow each platform's design guidelines
- Test icons on different backgrounds (light and dark)
- Compress images to reduce file size while maintaining quality
