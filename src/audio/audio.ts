/**
 * Kleine Web-Audio-Engine. Alle Klänge werden zur Laufzeit synthetisiert (eigene Platzhalter,
 * keine Samples, keine SID-Originale). Startet erst nach einer ausdrücklichen Nutzerinteraktion.
 * Jedes inhaltlich relevante Geräusch hat eine Textentsprechung im Adventure-Protokoll.
 */
import type { AudioCueId } from '../engine/types';

type Group = 'effects' | 'device' | 'music';

const CUE_GROUP: Record<AudioCueId, Group> = {
  phone_ring: 'device',
  doorbell: 'effects',
  drive: 'device',
  modem: 'device',
  dialtone: 'device',
  busy: 'device',
  keyclick: 'device',
  door: 'effects',
  hangup: 'device',
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private groups: Partial<Record<Group, GainNode>> = {};
  private musicTimer: number | null = null;
  enabled = true;
  volume = 0.6;

  /** Muss aus einem Nutzerereignis heraus aufgerufen werden (Autoplay-Regeln). */
  unlock(): void {
    if (!this.enabled) return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      for (const g of ['effects', 'device', 'music'] as Group[]) {
        const node = this.ctx.createGain();
        node.gain.value = g === 'music' ? 0.5 : 0.8;
        node.connect(this.master);
        this.groups[g] = node;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.stopMusic();
      void this.ctx?.suspend();
    } else if (this.ctx) void this.ctx.resume();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  private ready(): AudioContext | null {
    return this.enabled && this.ctx && this.ctx.state === 'running' ? this.ctx : null;
  }

  private tone(
    group: Group,
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType = 'square',
    vol = 0.15,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.005);
    g.gain.setValueAtTime(vol, start + Math.max(0.01, dur - 0.02));
    g.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(g).connect(this.groups[group]!);
    osc.start(start);
    osc.stop(start + dur + 0.01);
  }

  private noise(group: Group, start: number, dur: number, vol = 0.1): void {
    const ctx = this.ctx!;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let seed = 7;
    for (let i = 0; i < len; i++) {
      seed = (seed * 16807) % 2147483647;
      data[i] = (seed / 2147483647) * 2 - 1;
    }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(this.groups[group]!);
    src.start(start);
  }

  play(cue: AudioCueId): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const grp = CUE_GROUP[cue];
    switch (cue) {
      case 'phone_ring':
        for (let r = 0; r < 2; r++)
          for (let i = 0; i < 16; i++)
            this.tone(grp, i % 2 ? 440 : 480, t + r * 1.6 + i * 0.05, 0.05, 'triangle', 0.12);
        break;
      case 'doorbell':
        this.tone(grp, 660, t, 0.5, 'sine', 0.2);
        this.tone(grp, 523, t + 0.5, 0.8, 'sine', 0.2);
        break;
      case 'drive':
        for (let i = 0; i < 6; i++) this.noise(grp, t + i * 0.09, 0.04, 0.12);
        this.tone(grp, 60, t, 0.6, 'sawtooth', 0.05);
        break;
      case 'modem':
        this.tone(grp, 2100, t, 0.9, 'sine', 0.06);
        for (let i = 0; i < 10; i++)
          this.tone(grp, i % 2 ? 1270 : 1070, t + 0.9 + i * 0.06, 0.06, 'sine', 0.05);
        break;
      case 'dialtone':
        this.tone(grp, 425, t, 0.9, 'sine', 0.1);
        break;
      case 'busy':
        for (let i = 0; i < 3; i++) this.tone(grp, 425, t + i * 0.3, 0.15, 'sine', 0.1);
        break;
      case 'keyclick':
        this.noise(grp, t, 0.012, 0.05);
        break;
      case 'door':
        this.tone(grp, 70, t, 0.25, 'sine', 0.3);
        this.noise(grp, t, 0.08, 0.08);
        break;
      case 'hangup':
        this.noise(grp, t, 0.03, 0.15);
        break;
    }
  }

  /** Eigene, SID-inspirierte Endlosschleife für die INTRUDER-Demo (Pulswelle, Arpeggio, Bass, Hi-Hat). */
  startMusic(): void {
    const ctx = this.ready();
    if (!ctx || this.musicTimer !== null) return;
    const bpm = 132;
    const step = 60 / bpm / 4;
    // Akkordfolge Am – F – C – G als Arpeggio; eigene Komposition
    const chords = [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ];
    const bass = [45, 41, 36, 43];
    const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
    let pos = 0;
    let next = ctx.currentTime + 0.05;
    const schedule = () => {
      const c = this.ready();
      if (!c) return;
      while (next < c.currentTime + 0.2) {
        const bar = Math.floor(pos / 16) % 4;
        const chord = chords[bar];
        this.tone('music', midi(chord[pos % 3] + 12), next, step * 0.9, 'square', 0.05);
        if (pos % 4 === 0) this.tone('music', midi(bass[bar]), next, step * 3.5, 'triangle', 0.12);
        if (pos % 2 === 1) this.noise('music', next, 0.02, 0.03);
        next += step;
        pos++;
      }
    };
    schedule();
    this.musicTimer = window.setInterval(schedule, 50);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

export const audio = new AudioEngine();
