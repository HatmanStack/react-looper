# Build and Deployment Guide

This guide covers building and deploying Looper to all platforms: Web, Android, and iOS.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Web Deployment](#web-deployment)
- [Android Build](#android-build)
- [iOS Build](#ios-build)
- [App Store Submissions](#app-store-submissions)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Accounts Required

1. **Expo Account** (free)
   - Sign up at https://expo.dev
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at https://play.google.com/console
   - Complete account verification

3. **Apple Developer Account** ($99/year)
   - Enroll at https://developer.apple.com
   - Complete account verification

### Tools Required

- Node.js 18+ and npm
- Git
- EAS CLI (`npm install -g eas-cli`)
- For Android: Android Studio (for testing)
- For iOS: macOS with Xcode (for testing)

---

## Web Deployment

### Local Build and Test

1. **Build for production:**

   ```bash
   npm run build:web
   ```

   This creates an optimized production build in `web-build/` directory.

2. **Test locally:**

   ```bash
   npm run serve:web
   ```

   Visit http://localhost:8081 to test the production build.

3. **Verify:**
   - All features work correctly
   - PWA manifest is accessible
   - Service worker registers
   - Offline mode works
   - Performance is acceptable

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login:**

   ```bash
   vercel login
   ```

3. **Deploy:**

   ```bash
   # Production deployment
   vercel --prod

   # Or use the dashboard
   # 1. Connect GitHub repository
   # 2. Configure build settings (already in vercel.json)
   # 3. Deploy automatically on push to main
   ```

4. **Configure custom domain (optional):**
   ```bash
   vercel domains add looper.app
   vercel domains add www.looper.app
   ```

### Deploy to Netlify

1. **Install Netlify CLI:**

   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**

   ```bash
   netlify login
   ```

3. **Deploy:**

   ```bash
   # Build
   npm run build:web

   # Deploy
   netlify deploy --prod --dir=web-build
   ```

4. **Or use Netlify Dashboard:**
   - Connect GitHub repository
   - Build settings are in `netlify.toml`
   - Automatic deployments on push

### Deploy to Other Platforms

**Firebase Hosting:**

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

**AWS S3 + CloudFront:**

```bash
# Install AWS CLI
# Configure credentials
aws s3 sync web-build/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Android Build

### First-Time Setup

1. **Configure EAS Project:**

   ```bash
   eas build:configure
   ```

   This creates or updates `eas.json`.

2. **Update app configuration:**

   Ensure `app.config.ts` has:
   - `android.package`: "com.looper.app"
   - `android.versionCode`: Increments with each release
   - `version`: "1.0.0" (or current version)

### Generate Signing Credentials

EAS can generate signing credentials automatically:

```bash
eas credentials
```

Choose:
1. "Android"
2. "Set up new credentials"
3. Let EAS generate keystore

**OR** use existing keystore:

```bash
eas credentials
# Choose "Android" → "Use existing credentials" → "Keystore"
# Provide: keystore file, alias, passwords
```

### Build APK (for testing)

```bash
npm run eas:build:android

# Or directly:
eas build --platform android --profile production-apk
```

This creates an APK you can install on devices for testing.

### Build AAB (for Play Store)

```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (AAB) for Play Store submission.

### Monitor Build

```bash
# Check build status
eas build:list

# View build details
eas build:view BUILD_ID
```

### Download Build

```bash
# Download latest build
eas build:download

# Or download from dashboard:
# https://expo.dev/accounts/YOUR_ACCOUNT/projects/looper/builds
```

### Test APK

1. Download APK from EAS
2. Transfer to Android device
3. Install: `adb install app.apk`
4. Test all features:
   - Recording
   - Import
   - Playback
   - Speed/volume controls
   - Mixing
   - Export

---

## iOS Build

### First-Time Setup

1. **Configure EAS Project:**

   ```bash
   eas build:configure
   ```

2. **Update app configuration:**

   Ensure `app.config.ts` has:
   - `ios.bundleIdentifier`: "com.looper.app"
   - `ios.buildNumber`: Increments with each release
   - `version`: "1.0.0"

3. **Configure Apple credentials:**

   ```bash
   eas credentials
   ```

   Choose "iOS" and follow prompts to:
   - Add Apple ID
   - Generate distribution certificate
   - Generate provisioning profile

   **OR** provide existing credentials.

### Build for TestFlight/App Store

```bash
npm run eas:build:ios

# Or directly:
eas build --platform ios --profile production
```

### Monitor Build

```bash
# Check status
eas build:list

# View details
eas build:view BUILD_ID
```

### Download Build

```bash
# Download IPA
eas build:download

# Or from dashboard:
# https://expo.dev/accounts/YOUR_ACCOUNT/projects/looper/builds
```

### Test with TestFlight

1. Build completes on EAS
2. Submit to TestFlight:
   ```bash
   eas submit --platform ios --latest
   ```
3. Invite testers in App Store Connect
4. Testers download via TestFlight app
5. Collect feedback

---

## App Store Submissions

### Google Play Store

#### Prerequisites

- AAB file from EAS Build
- Screenshots (see `assets/store/README.md`)
- Store listing text (see `assets/store/store-listings.md`)
- Privacy policy hosted online
- Google Play Developer account

#### Submission Steps

1. **Create Application:**
   - Go to https://play.google.com/console
   - Click "Create app"
   - Fill in app name, language, type
   - Declare if it's free or paid

2. **Set Up Store Listing:**
   - App name: "Looper"
   - Short description (80 chars)
   - Full description
   - Upload screenshots:
     - Phone: 2-8 screenshots (1080x1920)
     - Tablet (optional): 1-8 screenshots
   - Upload app icon (512x512)
   - Upload feature graphic (1024x500)
   - Category: Music & Audio
   - Contact details: email, website

3. **Content Rating:**
   - Fill out questionnaire
   - All answers should be "No" (no objectionable content)
   - Expected rating: Everyone

4. **App Content:**
   - Privacy policy URL
   - App access (no special access needed)
   - Ads (No)
   - Target audience and content

5. **Create Release:**
   - Go to "Production" → "Create new release"
   - Upload AAB from EAS Build
   - Release name: "1.0.0"
   - Release notes (see store-listings.md)

6. **Pricing & Distribution:**
   - Free
   - Select countries
   - Review and publish

7. **Submit for Review:**
   - Review all sections
   - Click "Submit for review"
   - Wait for approval (typically 1-7 days)

#### Using EAS Submit

```bash
# Submit to Play Store
eas submit --platform android --latest

# Requires: Google Service Account JSON key
# Place in: ./secrets/google-play-service-account.json
```

### Apple App Store

#### Prerequisites

- IPA file from EAS Build
- Screenshots (see `assets/store/README.md`)
- Store listing text (see `assets/store/store-listings.md`)
- Privacy policy hosted online
- Apple Developer account

#### Submission Steps

1. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Click "My Apps" → "+"
   - Select "New App"
   - Platform: iOS
   - Name: "Looper"
   - Primary language: English
   - Bundle ID: com.looper.app (from app.config.ts)
   - SKU: looper-ios-app (unique identifier)

2. **App Information:**
   - Subtitle (30 chars): "Mix Audio with Speed Control"
   - Category: Music
   - Secondary category: Productivity
   - Content rights (if applicable)

3. **Pricing and Availability:**
   - Price: Free
   - Countries: All or select specific
   - Release: Manual or automatic

4. **Prepare for Submission:**

   **App Information:**
   - Privacy policy URL
   - Promotional text (170 chars)
   - Description (4000 chars)
   - Keywords (100 chars)
   - Support URL
   - Marketing URL (optional)

   **Screenshots:**
   Upload screenshots for required sizes:
   - 6.7" iPhone (1290x2796) - 1-10 images
   - 5.5" iPhone (1242x2208) - 1-10 images
   - iPad Pro (optional)

   **App Icon:**
   - 1024x1024 PNG (no transparency)

5. **Build:**
   - Upload IPA via EAS Submit or Transporter
   - Select build in App Store Connect
   - Wait for processing

6. **Version Information:**
   - Version: 1.0.0
   - Copyright: 2024 [Your Name/Company]
   - What's New: First release description

7. **Age Rating:**
   - Complete questionnaire
   - Expected: 4+

8. **App Review Information:**
   - Contact information
   - Demo account (if needed): N/A
   - Notes for reviewer: Explain how to test features

9. **Submit for Review:**
   - Review all information
   - Click "Submit for Review"
   - Wait for approval (typically 1-3 days, can be longer)

#### Using EAS Submit

```bash
# Submit to App Store
eas submit --platform ios --latest

# Requires: Apple ID, app-specific password
# Configure in eas.json or provide when prompted
```

---

## Continuous Integration

### Automated Web Deployment

Set up automatic web deployment on push to main:

**Vercel:**
- Connect GitHub repository
- Auto-deploys on push to main
- Preview deployments for PRs

**Netlify:**
- Connect GitHub repository
- Auto-deploys on push to main
- Deploy previews for PRs

### Automated Mobile Builds

Use GitHub Actions to trigger EAS builds:

```yaml
# See .github/workflows/build.yml
name: EAS Build
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm install -g eas-cli
      - run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## Version Management

### Incrementing Versions

**Semantic Versioning:**
- MAJOR.MINOR.PATCH (e.g., 1.0.0)
- MAJOR: Breaking changes
- MINOR: New features, backwards compatible
- PATCH: Bug fixes

**Update version:**

1. `app.config.ts`:
   - `version`: "1.0.1"

2. Android:
   - `android.versionCode`: Increment by 1 (1, 2, 3, ...)

3. iOS:
   - `ios.buildNumber`: Increment by 1 or use date-based

**Automated (recommended):**

Use `eas.json` with `autoIncrement: true` in production profile.

---

## Troubleshooting

### Web Build Issues

**Issue**: Build fails with out of memory
**Solution**: Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build:web`

**Issue**: PWA not installing
**Solution**: Check manifest.json is accessible, service worker is registered

### Android Build Issues

**Issue**: Build fails with "Execution failed for task"
**Solution**: Check `eas.json` Gradle configuration, ensure dependencies compatible

**Issue**: Keystore errors
**Solution**: Regenerate credentials with `eas credentials` or provide correct existing keystore

### iOS Build Issues

**Issue**: Provisioning profile errors
**Solution**: Regenerate in App Store Connect or let EAS manage credentials

**Issue**: "No suitable application records found"
**Solution**: Create app in App Store Connect first

### General

**Issue**: FFmpeg not working in production
**Solution**: Ensure ffmpeg packages in dependencies, not devDependencies

**Issue**: App crashes on startup
**Solution**: Check logs with `adb logcat` (Android) or Xcode console (iOS)

---

## Post-Release

### Monitoring

- **Crashes**: Monitor crash reports in Play Console and App Store Connect
- **Reviews**: Respond to user reviews promptly
- **Analytics**: If enabled, monitor usage patterns

### Updates

1. Fix bugs or add features
2. Update version numbers
3. Build new versions
4. Submit updates to stores
5. Release notes explaining changes

---

## Resources

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **Play Console**: https://play.google.com/console/about/
- **App Store Connect**: https://appstoreconnect.apple.com
- **React Native**: https://reactnative.dev

---

## Quick Command Reference

```bash
# Web
npm run build:web                  # Build web production
npm run serve:web                  # Serve web build locally

# EAS Builds
npm run eas:build:dev              # Development build (all platforms)
npm run eas:build:preview          # Preview build (all platforms)
npm run eas:build:prod             # Production build (all platforms)
npm run eas:build:android          # Android production build
npm run eas:build:ios              # iOS production build

# EAS Submit
eas submit --platform android      # Submit to Play Store
eas submit --platform ios          # Submit to App Store

# Status
eas build:list                     # List all builds
eas build:view [BUILD_ID]          # View build details
eas build:download                 # Download latest build

# Credentials
eas credentials                    # Manage credentials
eas whoami                         # Check logged in account
```
