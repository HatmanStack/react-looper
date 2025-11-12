# Looper User Guide

Welcome to Looper - your professional audio mixing and looping application! This guide will help you get started creating layered audio loops with ease.

---

## Table of Contents

- [What is Looper?](#what-is-looper)
- [Quick Start](#quick-start)
- [Understanding the Master Loop](#understanding-the-master-loop)
- [Recording Your First Loop](#recording-your-first-loop)
- [Adding Overdubs](#adding-overdubs)
- [Adjusting Tracks](#adjusting-tracks)
- [Loop Mode](#loop-mode)
- [Exporting Your Mix](#exporting-your-mix)
- [Settings](#settings)
- [Tips & Tricks](#tips--tricks)
- [Troubleshooting](#troubleshooting)

---

## What is Looper?

Looper is a cross-platform audio application that lets you create professional multi-track loops, similar to hardware loop stations like Boss RC-505 or TC Ditto. Layer vocals, instruments, beats, and effects to create complex musical compositions right from your device.

**Key Features:**
- 🎙️ Multi-track recording with your device microphone
- 📁 Import existing audio files
- 🔄 Master loop synchronization (like hardware loopers!)
- ⚡ Independent speed control per track (0.05x to 2.50x)
- 🔊 Independent volume control per track
- 💾 Export high-quality MP3 or WAV files
- 🌐 Works on Web, iOS, and Android
- 📴 All processing happens locally - works offline!

---

## Quick Start

### Web Version
1. Visit [looper.hatstack.fun](https://looper.hatstack.fun) in your browser
2. Click **Record** to start your first loop
3. Perform or speak into your microphone
4. Click **Stop** to set your master loop length
5. Click **Record** again to add overdubs (auto-stops at loop end!)
6. Adjust volume and speed as needed
7. Click **Save** to export your creation

### Mobile Version
1. Install Looper from the App Store or Google Play
2. Grant microphone permission when prompted
3. Follow steps 2-7 above

---

## Understanding the Master Loop

**The master loop is the foundation of your composition.** Think of it like the first layer on a hardware loop station.

### What is the Master Loop?

- The **first track you record or import** becomes the master loop
- Its **speed-adjusted duration** sets the loop length for all other tracks
- All subsequent tracks will **loop seamlessly** to match this duration
- The master track has a **special border** to identify it

### Example:

1. You record a 10-second drum pattern at normal speed → Master loop = 10 seconds
2. You slow it down to 0.5x speed → Master loop = 20 seconds (what you hear matters!)
3. You add a 7-second bass line → It loops seamlessly, playing twice in the 20-second cycle

---

## Recording Your First Loop

Your first recording is special - it sets the master loop length!

### Steps:

1. **Click the Record button** (microphone icon)
2. **Perform your loop** - drums, vocals, melody, whatever you like!
3. **Click Stop when finished** - the duration you record becomes your master loop
4. **Don't worry about perfect timing** - you can adjust speed and volume after recording

### Tips:

- **Count yourself in** mentally before recording
- **Keep it simple** for the first loop - you can add complexity with overdubs
- **Aim for musical phrase length** - 4, 8, or 16 beats work well
- **Remember**: The speed-adjusted duration is what counts, not the original recording length

---

## Adding Overdubs

Once you have a master loop, you can add unlimited overdubs that automatically sync!

### Steps:

1. **Click Record again** - notice the button now says "Record Overdub"
2. **Recording auto-stops** at the end of one loop cycle
3. **Your new track appears** below the master track
4. **It loops automatically** to match the master loop duration

### What Happens:

- **Shorter tracks repeat** seamlessly to fill the master loop
  - Example: 5-second track in 10-second loop = plays twice per cycle
- **Longer tracks get trimmed** to one loop cycle (if you stop early, that's OK!)
- **Progress indicator** shows where you are in the loop cycle

### Manual Stop Before Loop End:

If you want a shorter overdub (for rhythmic interest):
- Stop recording manually before the auto-stop
- The shorter track will loop multiple times per cycle
- Great for drum hits, stabs, or repetitive phrases!

---

## Adjusting Tracks

Each track can be adjusted independently:

### Speed Control (Playback Rate)

- **Range**: 0.05x (very slow) to 2.50x (double speed)
- **Purpose**: Time-stretch audio without changing pitch
- **Use cases**:
  - Slow down fast speech for clarity
  - Speed up long phrases to fit rhythm
  - Create ambient effects with extreme slowdown

**⚠️ Warning**: Changing the master track speed affects all tracks!
- A confirmation dialog will appear
- All tracks recalculate their loop boundaries
- Consider this a "tempo change" for your entire composition

### Volume Control

- **Range**: 0 (silent) to 100 (full volume)
- **Scaling**: Logarithmic (matches natural hearing)
- **Use cases**:
  - Balance vocals against instruments
  - Create dynamic builds (automate with touch)
  - Mix background and foreground elements

### Progress Indicators

Each track shows a **playback progress bar** during playback:
- Shows current position within the track's duration
- **Brief flash** when track loops (helps you visualize loop boundaries)
- Useful for understanding when shorter tracks restart

---

## Loop Mode

The **Loop Mode toggle** controls how tracks play during preview:

### Loop Mode ON (Default)

- Tracks loop continuously to match master loop duration
- **What you hear = what you'll export**
- Standard looper behavior
- Best for composing and performing

### Loop Mode OFF

- Tracks play once and stop
- Useful for **inspecting individual tracks** without looping
- Good for quality-checking recordings
- Switch back to ON for normal use

**Location**: Toggle button near the play/pause controls (loop icon)

---

## Exporting Your Mix

When you're ready to share your creation:

### Steps:

1. **Click the Save button** (disk icon)
2. **Configure export options**:
   - **Loop Count**: How many times to repeat (1, 2, 4, 8, or custom)
   - **Fadeout**: Smooth ending duration (None, 1s, 2s, 5s, or custom)
   - **Format**: MP3 (smaller files) or WAV (higher quality)
   - **Quality**: Low, Medium, or High
3. **Enter filename** (optional - default is timestamp)
4. **Click Confirm**
5. **Wait for processing** - mixing happens locally on your device
6. **Save or share** the file when complete!

### Export Duration Calculation:

```
Total Duration = (Master Loop × Loop Count) + Fadeout Duration
```

Example:
- Master loop: 10 seconds
- Loop count: 4
- Fadeout: 2 seconds
- **Total**: (10 × 4) + 2 = 42 seconds

### Recommended Settings:

- **For sharing clips**: 2-4 loops with 2s fadeout
- **For full songs**: 8+ loops with 5s fadeout
- **For DJ use**: 1 loop, no fadeout (seamless looping file)
- **For high quality**: WAV format at High quality
- **For social media**: MP3 format at Medium quality (smaller files)

---

## Settings

Access settings via the **gear icon** in the top-right corner.

### Looping Behavior

**Loop Crossfade Duration** (0-50ms)
- Smooths transitions at loop boundaries
- 0ms = gapless (default, most transparent)
- 10-30ms = subtle smoothing (reduces clicks)
- Use if you hear clicks at loop points

**Default Loop Mode**
- ON = Loop mode enabled when app starts (default)
- OFF = Loop mode disabled on start
- Affects new sessions only

### Export Settings

**Default Loop Count** (1, 2, 4, 8, or custom)
- Pre-selects loop count in save dialog
- Saves time if you always export same length

**Default Fadeout** (None, 1s, 2s, 5s, or custom)
- Pre-selects fadeout duration in save dialog
- 2s is good for most music

**Export Format** (MP3 or WAV)
- MP3: Smaller files, good quality
- WAV: Lossless, larger files

**Export Quality** (Low, Medium, High)
- Higher quality = larger files, better sound
- High recommended for professional use

### Recording Settings

Similar options for recording defaults (format, quality).

**Note**: Settings persist across app restarts and are stored locally on your device.

---

## Tips & Tricks

### Composition Tips

1. **Start with rhythm** - drums, beatbox, or percussion make great master loops
2. **Layer melodically** - bass, chords, then melody on top
3. **Leave space** - not every track needs to fill the entire loop
4. **Use volume** to create dynamics - quieter elements add depth
5. **Experiment with speed** - time-stretching can create interesting textures

### Technical Tips

1. **Monitor while recording** - wear headphones to hear existing tracks
2. **Test loop boundaries** - listen for clicks, adjust crossfade if needed
3. **Save often** - export versions as you build your composition
4. **Use gapless recordings** - record with loop-friendly material for best results
5. **Start simple** - get 2-3 solid layers before adding complexity

### Performance Tips

1. **Practice without recording** - get your timing right first
2. **Use visual cues** - watch the progress indicator for loop position
3. **Don't fear mistakes** - you can delete tracks and re-record
4. **Layer gradually** - add one track at a time, don't rush
5. **Perform dynamically** - vary your vocal/instrument intensity

---

## Troubleshooting

### "No sound when recording"

- Check microphone permissions (Settings → Privacy → Microphone)
- Ensure mic volume is up (system settings)
- Try refreshing the page (web) or restarting app (mobile)

### "Tracks sound out of sync"

- This shouldn't happen! If it does:
  - Check that Loop Mode is ON
  - Verify first track is showing master track styling
  - Try refreshing the app
  - Report a bug if the issue persists

### "Clicks or pops at loop boundaries"

- Increase **Loop Crossfade Duration** in settings (try 10-20ms)
- Use audio that loops smoothly (sustained notes, reverb tails)
- Ensure original recordings don't have abrupt endings

### "Auto-stop not working for overdubs"

- Verify you have a master track (first track should have special border)
- Check that Loop Mode is ON
- Ensure you're not manually stopping before auto-stop triggers

### "Export takes a long time"

- Expected behavior for many loops (web is slower than native)
- Try reducing loop count or track count
- Large files need more processing time
- Consider exporting overnight for very long mixes

### "Master track deleted all my tracks!"

- This is by design - the master track defines the loop
- Always get a confirmation dialog before this happens
- To prevent: Don't delete the first track unless starting fresh
- Workaround: Export before major changes

---

## Keyboard Shortcuts (Web Only)

- **Space** - Play/Pause
- **R** - Start/Stop Recording
- **S** - Open Save Dialog
- **L** - Toggle Loop Mode
- **Delete** - Delete selected track (with confirmation)
- **Esc** - Close dialogs

---

## Platform-Specific Notes

### Web
- ✅ Full feature support including loop export
- ✅ Works in Chrome, Firefox, Safari, Edge
- ⚠️ Mixing is slower than native (uses Web Audio API)
- 💡 Works offline after first load (PWA)

### iOS/Android
- ✅ Full feature support for recording and playback
- ⚠️ Loop export may use simplified mixing (documented limitation)
- ✅ Faster mixing than web (uses native FFmpeg)
- 💾 Recordings and settings persist across app restarts

---

## Getting Help

- **Documentation**: This guide and in-app help
- **Issues**: [GitHub Issues](https://github.com/USERNAME/react-looper/issues)
- **Community**: [Discussions](https://github.com/USERNAME/react-looper/discussions)

---

## Credits

Looper is an open-source project built with React Native, Expo, and Web Audio API.

**License**: MIT
**Version**: 1.0.0

Happy looping! 🎵
