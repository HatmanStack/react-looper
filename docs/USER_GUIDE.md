# Looper User Guide

Welcome to Looper! This guide will help you get started with recording, importing, and mixing audio tracks.

## Table of Contents

- [Getting Started](#getting-started)
- [Recording Audio](#recording-audio)
- [Importing Audio](#importing-audio)
- [Playback Controls](#playback-controls)
- [Adjusting Speed and Volume](#adjusting-speed-and-volume)
- [Mixing Tracks](#mixing-tracks)
- [Managing Tracks](#managing-tracks)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

**Web:**

- Visit [looper.app](https://looper.app) in any modern browser
- No installation required!
- For offline use, add to home screen (PWA)

**Android:**

- Download from [Google Play Store](https://play.google.com/store/apps/details?id=com.looper.app)
- Or install APK from GitHub Releases

**iOS:**

- Download from [Apple App Store](https://apps.apple.com/app/looper/id000000000)
- Or install via TestFlight (beta)

### First Launch

When you first open Looper:

1. You'll see an empty screen with "No tracks yet"
2. Two main action buttons are available:
   - **Record** (microphone icon) - Record new audio
   - **Import Audio** (folder icon) - Import existing audio files

### Permissions

Looper needs permissions to function:

**Microphone** (for recording):

- Required only when recording audio
- You'll be prompted when you press Record

**Storage** (for importing/exporting):

- Required for importing and saving audio files
- You'll be prompted when needed

---

## Recording Audio

### How to Record

1. **Press the Record button** (microphone icon at the top)
2. **Grant microphone permission** if prompted
3. **Start speaking/playing** - you'll see "Recording..." indicator
4. **Press Stop** when finished

Your recording will appear in the track list with a default name like "Recording 1".

### Recording Tips

- **Find a quiet environment** for best quality
- **Hold device steady** to reduce handling noise
- **Test audio levels** first with a short recording
- **Use headphones** to prevent echo/feedback
- **Speak clearly** about 6-12 inches from microphone

### Recording Quality

Looper records audio in high quality:

- **Format**: MP3
- **Sample Rate**: 44.1 kHz (CD quality)
- **Bit Rate**: 128 kbps
- **Channels**: Stereo

---

## Importing Audio

### How to Import

1. **Press the Import Audio button** (folder icon)
2. **Grant storage permission** if prompted
3. **Select audio file** from your device
4. The file will be imported and appear in your track list

### Supported Formats

Looper supports common audio formats:

- **MP3** (recommended)
- **WAV**
- **M4A / AAC**
- **WEBM** (web only)
- Most other standard audio formats

### Import Tips

- **Organize files** in folders before importing
- **Use descriptive names** for easy identification
- **Check file size** - very large files (>100MB) may take time to process
- **Ensure quality** - use at least 128kbps for best results

---

## Playback Controls

### Playing Tracks

**Individual Track:**

- Tap the **Play button** (►) next to any track
- Tap **Pause** (⏸) to pause
- Playing tracks are highlighted

**All Tracks:**

- Each track has independent playback control
- Multiple tracks can play simultaneously
- All tracks loop continuously when playing

### Looping

All tracks automatically loop when playing:

- Great for practice sessions
- Perfect for creating continuous mixes
- Adjust timing by starting/stopping individual tracks

---

## Adjusting Speed and Volume

### Speed Control

Each track has an independent speed slider:

**Range**: 0.05x (very slow) to 2.50x (very fast)

**Use Cases:**

- **0.05x - 0.50x**: Slow down for learning, transcription
- **0.50x - 0.75x**: Slightly slower for practice
- **1.00x**: Normal speed
- **1.25x - 1.50x**: Slightly faster
- **1.50x - 2.50x**: Fast playback, time-saving

**How to Adjust:**

1. Find the speed slider on the track
2. Drag left (slower) or right (faster)
3. Current speed is displayed (e.g., "1.00x")
4. Changes apply immediately during playback

**Tips:**

- Pitch is preserved at all speeds
- Great for practicing difficult musical passages
- Use slow speed for transcription work
- Combine different speeds for creative effects

### Volume Control

Each track has an independent volume slider:

**Range**: 0 (silent) to 100 (maximum)

**How to Adjust:**

1. Find the volume slider on the track
2. Drag left (quieter) or right (louder)
3. Current volume is displayed (e.g., "75")
4. Changes apply immediately during playback

**Tips:**

- Balance multiple tracks by adjusting volumes
- Use volume to create dynamic mixes
- Set to 0 to temporarily mute a track
- Volume uses logarithmic scaling for natural feel

---

## Mixing Tracks

Mixing combines all your tracks into a single audio file, accounting for speed and volume adjustments.

### How to Mix

1. **Adjust all tracks** to desired speed and volume
2. **Press the Save button** (at the bottom)
3. **Enter a filename** for your mix
4. **Press Save** to start mixing
5. **Wait for progress** - you'll see a progress bar
6. **Download/Save** when complete

### Mixing Process

The mixing process:

1. **Analyzes all tracks** with their speed and volume settings
2. **Applies adjustments** using professional FFmpeg processing
3. **Combines tracks** into a single audio stream
4. **Exports as MP3** with high quality
5. **Saves to your device** or downloads (web)

### Mixing Tips

- **Preview first** - play all tracks together before mixing
- **Check levels** - ensure volumes are balanced
- **Be patient** - mixing takes time, especially with many tracks
- **Name descriptively** - use clear filenames for organization
- **Keep originals** - original tracks remain unchanged

### Estimated Mixing Time

| Number of Tracks | Typical Duration | Mix Time Estimate |
| ---------------- | ---------------- | ----------------- |
| 2 tracks         | 3 minutes        | 5-10 seconds      |
| 5 tracks         | 3 minutes        | 15-30 seconds     |
| 10 tracks        | 3 minutes        | 30-60 seconds     |
| 20 tracks        | 3 minutes        | 1-2 minutes       |

_Times vary based on device performance and track complexity_

### Canceling Mix

If you need to cancel:

- Press the **Cancel** button in the progress modal
- Partial mix will be discarded
- Original tracks are unaffected

---

## Managing Tracks

### Renaming Tracks

1. **Tap track name** to edit (if supported)
2. **Or** remember names when recording/importing
3. Track names help organization with many tracks

### Deleting Tracks

1. **Find the Delete button** (trash icon) on the track
2. **Tap Delete**
3. **Confirm** (if prompted)
4. Track is permanently removed

**Warning**: Deletion is permanent and cannot be undone!

### Organizing Tracks

**Tips for Organization:**

- Record/import in order of layering
- Delete unused tracks promptly
- Use descriptive filenames when importing
- Keep total tracks under 20 for best performance

---

## Tips and Tricks

### For Musicians

**Practice with Backing Tracks:**

1. Import backing track
2. Record your performance
3. Adjust your recording volume to balance
4. Play together for practice

**Learn Difficult Passages:**

1. Import the song
2. Slow down to 0.25x - 0.50x
3. Practice along at slow speed
4. Gradually increase speed as you improve

**Create Harmonies:**

1. Record lead vocal
2. Record harmony vocals on separate tracks
3. Adjust volumes to blend
4. Mix together for a complete arrangement

### For Podcasters

**Multi-Track Podcast:**

1. Record each speaker separately
2. Adjust volumes for consistency
3. Add intro/outro music on separate tracks
4. Mix all together for final episode

**Edit Remotely Recorded Content:**

1. Import files from co-hosts
2. Sync timing by starting tracks at right moment
3. Adjust volumes for level matching
4. Export mixed episode

### For Students

**Transcription:**

1. Import lecture or audio material
2. Slow down to 0.50x - 0.75x
3. Pause as needed for note-taking
4. Repeat sections by looping

**Language Learning:**

1. Import language lesson audio
2. Slow down to hear pronunciation clearly
3. Record yourself repeating
4. Compare by playing both tracks

### For Audio Enthusiasts

**Sound Layering:**

1. Import multiple sound effects or samples
2. Adjust timing by starting/stopping strategically
3. Set different volumes for depth
4. Create complex soundscapes

**Remix Creation:**

1. Import original track
2. Record new elements (vocals, instruments)
3. Adjust speeds for tempo matching
4. Mix together for unique remix

---

## Troubleshooting

### Recording Issues

**Microphone doesn't work:**

- Check microphone permission is granted
- Try refreshing/restarting the app
- Check device microphone in other apps
- Ensure no other app is using microphone

**Recording quality is poor:**

- Reduce background noise
- Move closer to microphone
- Check device microphone isn't obstructed
- Try recording in a quieter environment

**Recording stops unexpectedly:**

- Check available storage space
- Ensure app has storage permission
- Avoid switching apps during recording

### Import Issues

**Can't import files:**

- Check storage permission is granted
- Ensure file is a supported audio format
- Try a different file to test
- Check file isn't corrupted

**Import is very slow:**

- Large files take time to process
- Check available storage space
- Close other apps to free memory

### Playback Issues

**Audio doesn't play:**

- Check device volume
- Try pause and play again
- Restart the app
- Check file imported correctly

**Audio sounds distorted:**

- Reduce volume if clipping occurs
- Check speed isn't set too extreme
- Ensure original file quality is good

**Multiple tracks don't sync:**

- This is expected - tracks start independently
- Use play/pause to sync manually
- Final mix will be properly synchronized

### Mixing Issues

**Mixing is very slow:**

- Normal for many tracks or long duration
- Check progress bar for status
- Avoid large numbers of tracks if time is concern
- Device performance affects speed

**Mixing fails:**

- Check available storage space
- Reduce number of tracks
- Ensure tracks are valid audio files
- Try restarting app and mixing again

**Mixed file sounds wrong:**

- Check speed and volume settings before mixing
- Preview by playing all tracks together first
- Ensure all tracks loaded correctly

### General Issues

**App crashes:**

- Update to latest version
- Clear app cache/data
- Reinstall app
- Report bug with details

**App is slow:**

- Close other apps
- Reduce number of loaded tracks
- Restart device
- Check available storage

---

## Keyboard Shortcuts (Web Only)

| Shortcut | Action                 |
| -------- | ---------------------- |
| `R`      | Start/Stop Recording   |
| `I`      | Import Audio           |
| `Space`  | Play/Pause first track |
| `S`      | Save/Mix               |
| `Delete` | Delete selected track  |

---

## Accessibility

Looper is designed to be accessible:

- **Screen Reader Support**: VoiceOver (iOS), TalkBack (Android), NVDA/JAWS (Web)
- **Large Touch Targets**: All buttons meet minimum size requirements
- **High Contrast**: Dark theme with high contrast ratios
- **Keyboard Navigation**: Full keyboard support on web
- **Descriptive Labels**: All controls have clear labels

To enable screen reader:

- **iOS**: Settings → Accessibility → VoiceOver
- **Android**: Settings → Accessibility → TalkBack
- **Web**: Use browser screen reader extension

---

## Privacy

Looper is privacy-focused:

- **No Account Required**: Use immediately, no signup
- **No Data Collection**: No analytics or tracking
- **Local Processing**: All audio stays on your device
- **No Cloud Upload**: Audio is never uploaded anywhere
- **Offline Capable**: Works completely offline

Permissions are only requested when needed and used only for stated purpose.

---

## Getting Help

**Need more help?**

- **Documentation**: [docs/](../docs/)
- **FAQ**: Check common issues above
- **Support Email**: support@looper.app
- **GitHub Issues**: Report bugs or request features
- **Website**: [looper.app](https://looper.app)

---

**Happy mixing! 🎵**
