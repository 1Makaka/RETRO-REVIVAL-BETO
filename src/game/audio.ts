/**
 * Frantic Battles - Retro Chiptune & Sound Effects Engine (Web Audio API)
 * Plays authentic 8-bit retro fantasy music and combat sound effects
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentTrack: 'Wiklund' | 'Neowave' | null = null;
  private isMusicPlaying = false;
  private musicTimer: number | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;
  private step = 0;

  constructor() {
    // Check saved preferences
    const savedMVol = localStorage.getItem('fb_music_enabled');
    const savedSVol = localStorage.getItem('fb_sfx_enabled');
    const savedTrack = localStorage.getItem('fb_selected_track');

    if (savedMVol !== null) this.musicEnabled = savedMVol === 'true';
    if (savedSVol !== null) this.sfxEnabled = savedSVol === 'true';
    if (savedTrack === 'Neowave' || savedTrack === 'Wiklund') {
      this.currentTrack = savedTrack;
    } else {
      this.currentTrack = 'Wiklund';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.35 : 0;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.45 : 0;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getSelectedTrack(): 'Wiklund' | 'Neowave' {
    return this.currentTrack || 'Wiklund';
  }

  public isMusicOn(): boolean {
    return this.musicEnabled;
  }

  public isSfxOn(): boolean {
    return this.sfxEnabled;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('fb_music_enabled', String(this.musicEnabled));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicEnabled ? 0.35 : 0;
    }
    if (this.musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    } else if (!this.musicEnabled && this.isMusicPlaying) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  public toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('fb_sfx_enabled', String(this.sfxEnabled));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxEnabled ? 0.45 : 0;
    }
    if (this.sfxEnabled) {
      this.playClick();
    }
    return this.sfxEnabled;
  }

  public setMuteAll(mute: boolean) {
    this.musicEnabled = !mute;
    this.sfxEnabled = !mute;
    localStorage.setItem('fb_music_enabled', String(this.musicEnabled));
    localStorage.setItem('fb_sfx_enabled', String(this.sfxEnabled));
    if (this.musicGain) this.musicGain.gain.value = this.musicEnabled ? 0.35 : 0;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxEnabled ? 0.45 : 0;
    if (mute) this.stopMusic();
    else this.startMusic();
  }

  public selectTrack(track: 'Wiklund' | 'Neowave') {
    this.currentTrack = track;
    localStorage.setItem('fb_selected_track', track);
    if (this.isMusicPlaying) {
      this.stopMusic();
      this.startMusic();
    } else if (this.musicEnabled) {
      this.startMusic();
    }
  }

  public startMusic() {
    this.initCtx();
    if (!this.musicEnabled) return;
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.step = 0;
    this.scheduleNextChiptuneNotes();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleNextChiptuneNotes() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const tempo = this.currentTrack === 'Wiklund' ? 140 : 124;
    const beatDuration = 60 / tempo;
    const stepDuration = beatDuration / 2; // 16th or 8th notes

    if (this.currentTrack === 'Wiklund') {
      this.playWiklundStep(now, this.step);
    } else {
      this.playNeowaveStep(now, this.step);
    }

    this.step = (this.step + 1) % 64;
    this.musicTimer = window.setTimeout(() => {
      this.scheduleNextChiptuneNotes();
    }, stepDuration * 1000);
  }

  // Track 1: "Wiklund" - Upbeat Adventure RPG Chiptune
  private playWiklundStep(now: number, step: number) {
    if (!this.ctx || !this.musicGain) return;

    // Melody: C major pentatonic adventure theme
    const melodyScale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
    const melodyPattern = [
      0, 2, 3, 2,  4, 3, 2, 0,
      1, 2, 3, 4,  3, 2, 1, 0,
      4, 3, 4, 5,  4, 3, 2, 0,
      2, 1, 0, 1,  2, 0,-1, 0
    ];

    const noteIdx = melodyPattern[step % 32];
    if (noteIdx >= 0) {
      const freq = melodyScale[noteIdx];
      this.playSynthNote(freq, 'square', 0.12, now, 0.15, this.musicGain);
    }

    // Bass line (triangle wave)
    const bassRoots = [130.81, 130.81, 174.61, 196.0]; // C3, C3, F3, G3
    const bassIdx = Math.floor((step % 32) / 8);
    if (step % 2 === 0) {
      const bassFreq = bassRoots[bassIdx] * (step % 4 === 2 ? 1.5 : 1);
      this.playSynthNote(bassFreq, 'triangle', 0.18, now, 0.3, this.musicGain);
    }

    // Percussion: Snare/Hat on 8-bit noise
    if (step % 4 === 2) {
      this.playNoiseHit(now, 0.08, 0.12, this.musicGain); // Snare
    } else if (step % 2 === 0) {
      this.playSynthNote(80, 'sine', 0.06, now, 0.25, this.musicGain); // Kick
    }
  }

  // Track 2: "Neowave" - Darker, Synthwave / Mysterious Castle Theme
  private playNeowaveStep(now: number, step: number) {
    if (!this.ctx || !this.musicGain) return;

    // A minor arpeggiator (A minor, F major, D minor, E minor)
    const chords = [
      [220.0, 261.63, 329.63, 440.0], // Am
      [174.61, 220.0, 261.63, 349.23], // F
      [146.83, 220.0, 293.66, 349.23], // Dm
      [164.81, 196.0, 246.94, 329.63], // Em
    ];
    const chordIdx = Math.floor((step % 32) / 8);
    const chord = chords[chordIdx];
    const arpNote = chord[step % 4];

    // Synth Arp
    this.playSynthNote(arpNote * 1.5, 'sawtooth', 0.10, now, 0.12, this.musicGain);

    // Deep Saw Bass on quarter notes
    if (step % 4 === 0) {
      this.playSynthNote(chord[0] * 0.5, 'sawtooth', 0.28, now, 0.25, this.musicGain);
    }

    // Kick on 0, Snare on 4
    if (step % 8 === 0) {
      this.playSynthNote(65, 'sine', 0.09, now, 0.3, this.musicGain);
    } else if (step % 8 === 4) {
      this.playNoiseHit(now, 0.1, 0.16, this.musicGain);
    }
  }

  private playSynthNote(
    freq: number,
    type: OscillatorType,
    duration: number,
    startTime: number,
    gainVal: number,
    dest: GainNode
  ) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Audio node cleanup safeguard
    }
  }

  private playNoiseHit(startTime: number, duration: number, gainVal: number, dest: GainNode) {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      whiteNoise.start(startTime);
    } catch {
      // Audio safety
    }
  }

  // --- Sound Effects (SFX) ---

  public playClick() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playSynthNote(784, 'square', 0.05, now, 0.2, this.sfxGain);
  }

  public playAttack() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Sword / hit swing
    this.playSynthNote(340, 'triangle', 0.08, now, 0.4, this.sfxGain);
    this.playNoiseHit(now, 0.06, 0.2, this.sfxGain);
  }

  public playPoison() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playSynthNote(480, 'sine', 0.12, now, 0.3, this.sfxGain);
    this.playSynthNote(620, 'sine', 0.15, now + 0.05, 0.25, this.sfxGain);
  }

  public playWhirlwind() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      this.playSynthNote(220 + i * 80, 'sawtooth', 0.08, now + i * 0.06, 0.2, this.sfxGain);
    }
  }

  public playMonsterUlt() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playSynthNote(90, 'sawtooth', 0.5, now, 0.5, this.sfxGain);
    this.playNoiseHit(now, 0.4, 0.4, this.sfxGain);
    this.playSynthNote(180, 'triangle', 0.4, now + 0.1, 0.4, this.sfxGain);
  }

  public playExplosion() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playNoiseHit(now, 0.35, 0.5, this.sfxGain);
    this.playSynthNote(80, 'sine', 0.4, now, 0.4, this.sfxGain);
  }

  public playEarthquake() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playSynthNote(70, 'triangle', 0.3, now, 0.4, this.sfxGain);
    this.playNoiseHit(now + 0.05, 0.2, 0.3, this.sfxGain);
  }

  public playLevelUp() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      this.playSynthNote(freq, 'triangle', 0.15, now + idx * 0.08, 0.3, this.sfxGain!);
    });
  }

  public playVictory() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      this.playSynthNote(freq, 'square', 0.25, now + idx * 0.12, 0.3, this.sfxGain!);
    });
  }

  public playWhoosh() {
    this.initCtx();
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playNoiseHit(now, 0.18, 0.25, this.sfxGain);
  }
}

export const soundEngine = new SoundEngine();
