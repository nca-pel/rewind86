/**
 * Kleine Web-Audio-Engine. Alle Klänge werden zur Laufzeit synthetisiert (eigene Platzhalter,
 * keine Samples, keine SID-Originale). Startet erst nach einer ausdrücklichen Nutzerinteraktion.
 * Jedes inhaltlich relevante Geräusch hat eine Textentsprechung im Adventure-Protokoll.
 */
import type { AudioCueId } from '../engine/types';
import { BPM, songStep, type SongStep } from './demoSong';

/** Musikstück: Tempo und Noten je Sechzehntel (siehe demoSong.ts, fernhandelSong.ts) */
export interface MusicTrack {
  bpm: number;
  at(step: number): SongStep;
}

export const DEMO_TRACK: MusicTrack = { bpm: BPM, at: songStep };

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
  private track: MusicTrack | null = null;
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

  /** Kick: kurzer Sinus mit fallender Tonhöhe */
  private kick(start: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, start);
    osc.frequency.exponentialRampToValueAtTime(45, start + 0.12);
    g.gain.setValueAtTime(0.28, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    osc.connect(g).connect(this.groups.music!);
    osc.start(start);
    osc.stop(start + 0.18);
  }

  private distortion: Float32Array | null = null;

  /** E-Gitarre nachgeahmt: Sägezähne, Übersteuerung (Waveshaper), Tiefpass; mute = Palm Mute */
  private guitar(
    notes: number[],
    freqOf: (n: number) => number,
    start: number,
    dur: number,
    mute: boolean,
  ): void {
    const ctx = this.ctx!;
    if (!this.distortion) {
      const curve = new Float32Array(1024);
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 6);
      }
      this.distortion = curve;
    }
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.distortion;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = mute ? 900 : 2600;
    lp.Q.value = 1.2;
    const g = ctx.createGain();
    const len = mute ? Math.min(dur, 0.09) : dur;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.05, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, start + len);
    shaper.connect(lp).connect(g).connect(this.groups.music!);
    for (const n of notes) {
      for (const cents of [-7, 7]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freqOf(n);
        osc.detune.value = cents;
        osc.connect(shaper);
        osc.start(start);
        osc.stop(start + len + 0.02);
      }
    }
  }

  /** Solo-Gitarre: eine Stimme, optional von unten angebogen, Vibrato bei langen Tönen */
  private soloNote(freq: number, start: number, dur: number, bend: boolean): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    if (bend) {
      osc.frequency.setValueAtTime(freq * Math.pow(2, -2 / 12), start);
      osc.frequency.linearRampToValueAtTime(freq, start + 0.07);
    } else osc.frequency.value = freq;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, start);
    depth.gain.linearRampToValueAtTime(dur > 0.2 ? 18 : 0, start + 0.18);
    lfo.connect(depth).connect(osc.detune);
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.distortion;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.06, start + 0.01);
    g.gain.setValueAtTime(0.06, start + Math.max(0.02, dur - 0.05));
    g.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(shaper).connect(lp).connect(g).connect(this.groups.music!);
    osc.start(start);
    lfo.start(start);
    osc.stop(start + dur + 0.02);
    lfo.stop(start + dur + 0.02);
  }

  /** Eigene, SID-inspirierte Komposition für die INTRUDER-Demo (siehe demoSong.ts), Wiederholung nach 88 Takten. */
  startMusic(track: MusicTrack = DEMO_TRACK): void {
    const ctx = this.ready();
    if (!ctx) return;
    if (this.musicTimer !== null) {
      if (this.track === track) return;
      this.stopMusic();
    }
    this.track = track;
    const step = 60 / track.bpm / 4;
    const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
    let pos = 0;
    let next = ctx.currentTime + 0.05;
    const schedule = () => {
      const c = this.ready();
      if (!c) return;
      while (next < c.currentTime + 0.2) {
        const e = track.at(pos);
        if (e.lead) this.tone('music', midi(e.lead), next, step * (e.hold ? 14 : 1.8), 'square', 0.05);
        if (e.arp) this.tone('music', midi(e.arp), next, step * 0.9, 'square', 0.03);
        if (e.bass) this.tone('music', midi(e.bass.note), next, step * e.bass.steps, 'triangle', 0.12);
        if (e.pad) for (const n of e.pad) this.tone('music', midi(n), next, step * 15.5, 'triangle', 0.035);
        if (e.guitar) this.guitar(e.guitar.notes, midi, next, step * e.guitar.steps, e.guitar.mute);
        if (e.solo) this.soloNote(midi(e.solo.note), next, step * e.solo.steps * 0.95, e.solo.bend);
        if (e.crash) this.noise('music', next, 0.6, 0.05);
        if (e.kick) this.kick(next);
        if (e.snare) this.noise('music', next, 0.09, 0.07);
        if (e.hat) this.noise('music', next, 0.02, 0.03);
        if (e.openHat) this.noise('music', next, 0.07, 0.025);
        if (e.riser) this.noise('music', next, 0.05, 0.02 + e.riser * 0.1);
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
    this.track = null;
  }
}

export const audio = new AudioEngine();
