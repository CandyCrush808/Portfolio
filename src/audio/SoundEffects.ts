/**
 * Lightweight 8-bit Web Audio Synthesizer for PixelQuest.
 * Generates authentic retro sound effects procedurally without requiring audio files.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private volume = 0.25;

  constructor() {
    try {
      const saved = localStorage.getItem('pixelquest_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      // Ignore localStorage exceptions in sandboxed environments
    }
  }

  private init(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('pixelquest_muted', String(muted));
    } catch {
      // Storage unavailable
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playInteract();
    }
    return this.muted;
  }

  /** Soft retro interaction chime (C5 -> E5 -> G5) */
  playInteract(): void {
    if (this.muted) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(this.volume * 0.4, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.13);
    });
  }

  /** Quick subtle typewriter blip for dialogue letters */
  playDialogueBlip(): void {
    if (this.muted) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = 440 + Math.random() * 80;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /** Retro modal open whoosh */
  playOpen(): void {
    if (this.muted) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.08); // C5

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /** Retro modal close click */
  playClose(): void {
    if (this.muted) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /** Objective / Quest completion fanfare */
  playSuccess(): void {
    if (this.muted) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const start = now + idx * 0.08;
      const duration = idx === notes.length - 1 ? 0.35 : 0.12;

      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.volume * 0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    });
  }

  /** Adventure start trumpet */
  playStart(): void {
    if (this.muted) return;
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.09;
      const duration = idx === notes.length - 1 ? 0.4 : 0.14;

      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.volume * 0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    });
  }
}

export const soundEffects = new SoundManager();
