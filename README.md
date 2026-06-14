# Simple Mixer 
A lightweight, web-based audio mixer for combining and mixing multiple audio tracks with real-time volume and pan controls.

## Features

 **Core Features:**
- Load up to **6 audio tracks** simultaneously
- **Volume faders** for individual track control (0-100%)
- **Pan sliders** for stereo placement (left-center-right)
- **Master volume** control for overall output level

- Play, Pause, Stop buttons
- Timeline scrubbing (seek bar)
- Real-time time display (current / total duration)
- Synchronized playback across all tracks

- Export your mix as a **WAV file** with full quality
- Download directly to your device

## Getting Started

### Installation

```bash
cd simple-mixer
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Production Build

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## Usage

1. **Load Audio Files**
   - Select one or more audio files (MP3, WAV, OGG, FLAC, etc.)   - Click "
   - Each file will be assigned to a track automatically

2. **Adjust Mixing**
   - Use the **Volume** slider on each track (0-100%)
   - Use the **Pan** slider to position audio left or right
   - Adjust **Master Volume** for overall output

3. **Playback**
   - Click **Play** to start
   - Use **Seek bar** to jump to any point in the timeline
   - Click **Pause** to pause playback
   - Click **Stop** to stop and reset to the beginning

4. **Export**
   - A WAV file will be downloaded to your device   - Once satisfied with your mix, click **

## Technical Stack

- **Frontend:** React 19 + Vite
- **Audio Processing:** Web Audio API
- **Export:** OfflineAudioContext for WAV rendering
- **Styling:** CSS3 with dark theme

## Audio Format Support

Supported input formats depend on your browser:
- MP3
- WAV
- OGG
- FLAC
- AAC
- M4A

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with Web Audio API support

## Limitations

- Maximum **6 tracks** per mix
- Export quality depends on source audio
- Real-time effects/EQ not available in this version

## Project Structure

```
src/
 App.jsx           # Main mixer component
 App.css           # Mixer styling
 AudioEngine.js    # Web Audio API wrapper
 Track.jsx         # Individual track component
 index.css         # Global styles
 main.jsx          # React entry point
```

## License

MIT

## Future Enhancements

- EQ controls per track
- Master track effects
- Multiple undo/redo
- Project save/load
- Real-time waveform visualization
- Loop functionality
