export class AudioEngine {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    this.masterGain.gain.value = 1;

    this.tracks = [];
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.maxTracks = 6;
    this.tempo = 1; // 1 = normal speed, 0.5 = half speed, etc.
  }

  async loadAudioFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    return this.context.decodeAudioData(arrayBuffer);
  }

  createTrack(audioBuffer) {
    if (this.tracks.length >= this.maxTracks) {
      throw new Error(`Maximum ${this.maxTracks} tracks allowed`);
    }

    const track = {
      id: Date.now() + Math.random(),
      buffer: audioBuffer,
      source: null,
      gainNode: this.context.createGain(),
      panNode: this.context.createStereoPanner(),
      name: `Track ${this.tracks.length + 1}`,
      duration: audioBuffer.duration,
      volume: 1,
      pan: 0,
      isPlaying: false,
      isMuted: false,
      isSoloed: false,
    };

    track.gainNode.connect(track.panNode);
    track.panNode.connect(this.masterGain);
    track.gainNode.gain.value = track.volume;
    track.panNode.pan.value = track.pan;

    this.tracks.push(track);
    return track;
  }

  removeTrack(trackId) {
    const index = this.tracks.findIndex((t) => t.id === trackId);
    if (index !== -1) {
      if (this.tracks[index].source) {
        this.tracks[index].source.stop();
      }
      this.tracks.splice(index, 1);
    }
  }

  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startTime = this.context.currentTime - this.pauseTime / this.tempo;

    this.tracks.forEach((track) => {
      if (track.buffer) {
        track.source = this.context.createBufferSource();
        track.source.buffer = track.buffer;
        track.source.playbackRate.value = this.tempo;
        track.source.connect(track.gainNode);
        track.source.start(0, this.pauseTime);

        track.source.onended = () => {
          track.isPlaying = false;
        };

        track.isPlaying = true;
      }
    });
  }

  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.pauseTime = (this.context.currentTime - this.startTime) * this.tempo;

    this.tracks.forEach((track) => {
      if (track.source) {
        track.source.stop();
        track.source = null;
        track.isPlaying = false;
      }
    });
  }

  stop() {
    this.isPlaying = false;
    this.pauseTime = 0;
    this.startTime = 0;

    this.tracks.forEach((track) => {
      if (track.source) {
        track.source.stop();
        track.source = null;
        track.isPlaying = false;
      }
    });
  }

  seek(time) {
    const wasPlaying = this.isPlaying;

    if (this.isPlaying) {
      this.pause();
    }

    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()));

    if (wasPlaying) {
      this.play();
    }
  }

  setTrackVolume(trackId, volume) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.volume = Math.max(0, Math.min(volume, 1));
      this.updateTrackGain(track);
    }
  }

  setTrackPan(trackId, pan) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.pan = Math.max(-1, Math.min(pan, 1));
      track.panNode.pan.value = track.pan;
    }
  }

  setTrackMute(trackId, muted) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.isMuted = muted;
      // If muting, unsoloify this track
      if (muted && track.isSoloed) {
        track.isSoloed = false;
      }
      this.updateTrackGain(track);
    }
  }

  setTrackSolo(trackId, soloed) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) {
      track.isSoloed = soloed;
      // If soloing, unmute this track
      if (soloed && track.isMuted) {
        track.isMuted = false;
      }
      this.updateAllTrackGains();
    }
  }

  updateTrackGain(track) {
    if (track.isMuted) {
      track.gainNode.gain.value = 0;
    } else {
      const hasSoloedTracks = this.tracks.some((t) => t.isSoloed);
      if (hasSoloedTracks && !track.isSoloed) {
        track.gainNode.gain.value = 0;
      } else {
        track.gainNode.gain.value = track.volume;
      }
    }
  }

  updateAllTrackGains() {
    this.tracks.forEach((track) => {
      this.updateTrackGain(track);
    });
  }

  setMasterVolume(volume) {
    this.masterGain.gain.value = Math.max(0, Math.min(volume, 1));
  }

  setTempo(tempo) {
    const newTempo = Math.max(0.25, Math.min(tempo, 2)); // 0.25x to 2x
    
    if (this.isPlaying) {
      this.pause();
      this.tempo = newTempo;
      this.play();
    } else {
      this.tempo = newTempo;
    }
  }

  getCurrentTime() {
    if (this.isPlaying) {
      return (this.context.currentTime - this.startTime) * this.tempo;
    }
    return this.pauseTime;
  }

  getDuration() {
    if (this.tracks.length === 0) return 0;
    return Math.max(...this.tracks.map((t) => t.duration));
  }

  async exportMix() {
    const duration = this.getDuration();
    if (duration === 0) {
      throw new Error('No audio to export');
    }

    const sampleRate = this.context.sampleRate;
    const offlineContext = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    const masterGain = offlineContext.createGain();
    masterGain.gain.value = this.masterGain.gain.value;
    masterGain.connect(offlineContext.destination);

    for (const track of this.tracks) {
      if (track.buffer && !track.isMuted) {
        const gainNode = offlineContext.createGain();
        const panNode = offlineContext.createStereoPanner();

        gainNode.gain.value = track.volume;
        panNode.pan.value = track.pan;

        gainNode.connect(panNode);
        panNode.connect(masterGain);

        const source = offlineContext.createBufferSource();
        source.buffer = track.buffer;
        source.playbackRate.value = this.tempo;
        source.connect(gainNode);
        source.start(0, 0);
      }
    }

    const renderedBuffer = await offlineContext.startRendering();
    return this.bufferToWave(renderedBuffer);
  }

  bufferToWave(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    let recordedBlob = new Blob();

    const buffers = [];
    for (let i = 0; i < numberOfChannels; i++) {
      buffers[i] = audioBuffer.getChannelData(i);
    }

    const interleaved =
      numberOfChannels === 2
        ? this.interleave(buffers[0], buffers[1])
        : buffers[0];

    const dataLength = interleaved.length * (bitDepth / 8);
    const bufferLength = 36 + dataLength;
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2 * numberOfChannels, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    const volume = 0.8;
    for (let i = 0; i < interleaved.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, interleaved[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, s, true);
    }

    recordedBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return recordedBlob;
  }

  interleave(leftChannel, rightChannel) {
    const length = leftChannel.length + rightChannel.length;
    const result = new Float32Array(length);

    let inputIndex = 0;

    for (let i = 0; i < length; ) {
      result[i++] = leftChannel[inputIndex];
      result[i++] = rightChannel[inputIndex];
      inputIndex++;
    }
    return result;
  }
}
