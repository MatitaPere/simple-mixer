import { useState, useEffect, useRef } from 'react';
import { AudioEngine } from './AudioEngine';
import { Track } from './Track';
import './App.css';

function App() {
  const engineRef = useRef(null);
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(1);
  const updateIntervalRef = useRef(null);

  useEffect(() => {
    engineRef.current = new AudioEngine();
  }, []);

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const updateTime = () => {
    if (engineRef.current && engineRef.current.isPlaying) {
      setCurrentTime(engineRef.current.getCurrentTime());
    }
  };

  useEffect(() => {
    if (isPlaying && !updateIntervalRef.current) {
      updateIntervalRef.current = setInterval(updateTime, 50);
    } else if (!isPlaying && updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  const handleLoadFiles = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (tracks.length >= 6) break;

      try {
        const audioBuffer = await engineRef.current.loadAudioFile(file);
        const track = engineRef.current.createTrack(audioBuffer);
        track.name = file.name;

        setTracks([...engineRef.current.tracks]);
        setDuration(engineRef.current.getDuration());
      } catch (error) {
        console.error('Error loading file:', error);
        alert(`Error loading ${file.name}`);
      }
    }

    e.target.value = '';
  };

  const handleRemoveTrack = (trackId) => {
    engineRef.current.removeTrack(trackId);
    setTracks([...engineRef.current.tracks]);
    setDuration(engineRef.current.getDuration());
  };

  const handleVolumeChange = (trackId, volume) => {
    engineRef.current.setTrackVolume(trackId, volume);
    setTracks([...engineRef.current.tracks]);
  };

  const handlePanChange = (trackId, pan) => {
    engineRef.current.setTrackPan(trackId, pan);
    setTracks([...engineRef.current.tracks]);
  };

  const handlePlay = () => {
    if (!isPlaying) {
      engineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      engineRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    engineRef.current.seek(time);
    setCurrentTime(time);
  };

  const handleMasterVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    setMasterVolume(volume);
    engineRef.current.setMasterVolume(volume);
  };

  const handleExport = async () => {
    try {
      if (tracks.length === 0) {
        alert('Add some audio tracks first');
        return;
      }

      const blob = await engineRef.current.exportMix();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mix.wav';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting mix: ' + error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Simple Mixer</h1>
      </header>

      <div className="master-controls">
        <div className="playback-controls">
          <button className="btn" onClick={handlePlay} disabled={isPlaying}>
      Play            
          </button>
          <button className="btn" onClick={handlePause} disabled={!isPlaying}>
        Pause            
          </button>
          <button className="btn" onClick={handleStop}>
         Stop            
          </button>
        </div>

        <div className="time-display">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="seek-bar"
          />
          <span className="time-text">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="master-volume">
          <label>Master Volume: {Math.round(masterVolume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={handleMasterVolumeChange}
            className="fader"
          />
        </div>
      </div>

      <div className="file-controls">
        <div className="control-box">
          <label htmlFor="file-input" className="control-label">LOAD FILES</label>
          <label htmlFor="file-input" className="btn-file">
            <input            
              id="file-input"
              type="file"
              multiple
              accept="audio/*"
              onChange={handleLoadFiles}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="control-box">
          <label className="control-label">EXPORT MIX</label>
          <button className="btn-export" onClick={handleExport} title="Export as WAV file">
          </button>            
        </div>

        <span className="track-count">
          {tracks.length} / 6 Tracks
        </span>
      </div>

      <div className="tracks-container">
        {tracks.length === 0 ? (
          <div className="empty-state">
            <p>Load audio files to get started</p>
          </div>
        ) : (
          <div className="tracks-grid">
            {tracks.map((track) => (
              <Track
                key={track.id}
                track={track}
                onVolumeChange={handleVolumeChange}
                onPanChange={handlePanChange}
                onRemove={handleRemoveTrack}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
