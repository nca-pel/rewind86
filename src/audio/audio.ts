/**
 * Kleine Web-Audio-Engine. Alle Klänge werden zur Laufzeit synthetisiert (eigene Platzhalter,
 * keine Samples, keine SID-Originale). Startet erst nach einer ausdrücklichen Nutzerinteraktion.
 * Jedes inhaltlich relevante Geräusch hat eine Textentsprechung im Adventure-Protokoll.
 */
import type { AudioCueId } from '../engine/types';
import { RING_PERIOD_S, renderBell } from './bell';
import { BPM, songStep, type SongStep } from './demoSong';
import { TITLE_BPM, titleStep } from './titleSong';
import { speechSeconds, type RadioItem } from './radioProgram';

/** Musikstück: Tempo und Noten je Sechzehntel (siehe demoSong.ts, fernhandelSong.ts) */
export interface MusicTrack {
  bpm: number;
  at(step: number): SongStep;
  /** Länge in Sechzehnteln; ohne Angabe läuft das Stück endlos (Wiederholung steckt in at()) */
  steps?: number;
  /** Klangfarbe der Melodiestimme (Standard: Rechteck) */
  lead?: OscillatorType;
}

export const DEMO_TRACK: MusicTrack = { bpm: BPM, at: songStep };
export const TITLE_TRACK: MusicTrack = { bpm: TITLE_BPM, at: titleStep, lead: 'sawtooth' };

type Group = 'effects' | 'device' | 'music' | 'radio';

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

/**
 * Einsekündige Stille als WAV. iOS spielt Web Audio sonst in der Kategorie „Ambient“ und schweigt bei
 * aktivem Stummschalter; ein laufendes <audio>-Element schaltet auf „Wiedergabe“ um (wie ein YouTube-Video).
 */
function silentWavUrl(): string {
  const rate = 8000;
  const n = rate;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, 'data');
  v.setUint32(40, n, true);
  new Uint8Array(buf, 44).fill(128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

class AudioEngine {
  private keepAlive: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private groups: Partial<Record<Group, GainNode>> = {};
  private stopTrack: (() => void) | null = null;
  private track: MusicTrack | null = null;
  /** Gewünschtes Stück: startet, sobald der Ton freigeschaltet ist (Titelmusik vor der ersten Interaktion) */
  private musicWant: MusicTrack | null = null;
  /** Gewünschter Zustand – wird nach Freischalten/Wiedereinschalten des Tons hergestellt (sync) */
  private ringWant = false;
  private ringTimer: number | null = null;
  private bell: AudioBuffer | null = null;
  private radioWant: { station: string; playlist: () => RadioItem[] } | null = null;
  private radioGen = 0;
  private radioRunning = false;
  private radioStop: (() => void) | null = null;
  private hiss: AudioBufferSourceNode | null = null;
  enabled = true;
  volume = 0.6;

  /** Muss aus einem Nutzerereignis heraus aufgerufen werden (Autoplay-Regeln). */
  unlock(): void {
    if (!this.enabled) return;
    this.playbackSession();
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
      // Radio: kleiner Lautsprecher – Bässe und Höhen beschnitten
      const radio = this.ctx.createGain();
      radio.gain.value = 0.55;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 180;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 4500;
      radio.connect(hp).connect(lp).connect(this.master);
      this.groups.radio = radio;
    }
    this.resumeAndSync();
  }

  /** iOS: Ton auch bei aktivem Stummschalter (Kategorie „Wiedergabe“) */
  private playbackSession(): void {
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
      if (!this.keepAlive) {
        const el = new Audio(silentWavUrl());
        el.loop = true;
        el.setAttribute('playsinline', '');
        this.keepAlive = el;
      }
      void this.keepAlive.play().catch(() => undefined);
    } catch {
      /* ohne Unterstützung bleibt es bei Web Audio */
    }
  }

  private resumeAndSync(): void {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    if (ctx.state === 'running') this.sync();
    else void ctx.resume().then(() => this.sync());
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.haltMusic();
      this.haltRing();
      this.haltRadio();
      void this.ctx?.suspend();
      this.keepAlive?.pause();
    } else this.resumeAndSync();
  }

  /** Gewünschte Dauergeräusche (Klingeln, Radio) starten, sobald der Ton läuft */
  private sync(): void {
    if (!this.ready()) return;
    if (this.musicWant && !this.stopTrack) this.startMusic(this.musicWant);
    if (this.ringWant && this.ringTimer === null) this.runRing();
    if (this.radioWant && !this.radioRunning) this.runRadio();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  // ------------------------------------------------------------------ Telefonklingel

  /** Telefon klingelt (Zustand): 1 s Klingeln, 4 s Pause, bis abgehoben oder aufgegeben wird */
  setRinging(on: boolean): void {
    this.ringWant = on;
    if (on) this.sync();
    else this.haltRing();
  }

  private ringOnce(): void {
    const ctx = this.ready();
    if (!ctx) return;
    if (!this.bell) {
      const data = renderBell(ctx.sampleRate);
      this.bell = ctx.createBuffer(1, data.length, ctx.sampleRate);
      this.bell.getChannelData(0).set(data);
    }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = 0.55;
    src.buffer = this.bell;
    src.connect(g).connect(this.groups.device!);
    src.start(ctx.currentTime + 0.02);
  }

  private runRing(): void {
    this.ringOnce();
    this.ringTimer = window.setInterval(() => this.ringOnce(), RING_PERIOD_S * 1000);
  }

  private haltRing(): void {
    if (this.ringTimer !== null) window.clearInterval(this.ringTimer);
    this.ringTimer = null;
  }

  // ------------------------------------------------------------------ Radio

  /**
   * Radio einschalten bzw. Sender wechseln. `playlist` liefert den Ablauf; sie wird nach dem letzten Eintrag
   * erneut abgefragt (Endlosschleife, Nachrichten aktuell zur Spielzeit).
   */
  startRadio(station: string, playlist: () => RadioItem[]): void {
    if (this.radioWant?.station === station) {
      this.radioWant.playlist = playlist;
      return;
    }
    this.haltRadio();
    this.radioWant = { station, playlist };
    this.sync();
  }

  stopRadio(): void {
    this.radioWant = null;
    this.haltRadio();
  }

  private haltRadio(): void {
    this.radioGen++;
    this.radioRunning = false;
    this.radioStop?.();
    this.radioStop = null;
    try {
      this.hiss?.stop();
    } catch {
      /* schon gestoppt */
    }
    this.hiss = null;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  private runRadio(): void {
    const ctx = this.ctx!;
    const gen = ++this.radioGen;
    this.radioRunning = true;
    // leises UKW-Rauschen unter allem
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let seed = 99;
    for (let i = 0; i < len; i++) {
      seed = (seed * 16807) % 2147483647;
      d[i] = (seed / 2147483647) * 2 - 1;
    }
    const hiss = ctx.createBufferSource();
    const hg = ctx.createGain();
    hg.gain.value = 0.012;
    hiss.buffer = buf;
    hiss.loop = true;
    hiss.connect(hg).connect(this.groups.radio!);
    hiss.start();
    this.hiss = hiss;

    let items: RadioItem[] = [];
    let i = 0;
    const next = () => {
      if (gen !== this.radioGen || !this.radioWant) return;
      if (i >= items.length) {
        items = this.radioWant.playlist();
        i = 0;
        if (!items.length) return;
      }
      const it = items[i++];
      if (it.kind === 'song') this.radioStop = this.runTrack(it.track, 'radio', next);
      else if (it.kind === 'speech') this.radioStop = this.speak(it.text, it.lang, next);
      else {
        const id = window.setTimeout(next, it.seconds * 1000);
        this.radioStop = () => window.clearTimeout(id);
      }
    };
    next();
  }

  /** Sprachausgabe des Browsers; ohne sie verstreicht nur die geschätzte Sprechzeit */
  private speak(text: string, lang: string, done: () => void): () => void {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(guard);
      // kurze Atempause zwischen zwei Meldungen
      window.setTimeout(done, 700);
    };
    const guard = window.setTimeout(finish, (speechSeconds(text) * 1.6 + 4) * 1000);
    if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
      window.clearTimeout(guard);
      const id = window.setTimeout(done, speechSeconds(text) * 1000);
      return () => window.clearTimeout(id);
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const prefix = lang.slice(0, 2);
    const voices = speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.replace('_', '-') === lang) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (voice) u.voice = voice;
    u.rate = lang === 'en-GB' ? 1.08 : 1.0;
    u.pitch = lang === 'en-GB' ? 1.05 : 0.95;
    u.volume = Math.min(1, this.volume * 1.2);
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
    return () => {
      finished = true;
      window.clearTimeout(guard);
    };
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
        // Dauerklingeln übernimmt setRinging(); der Hinweis-Cue klingelt nur, wenn das nicht läuft
        if (this.ringTimer === null) this.ringOnce();
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
  private kick(start: number, group: Group = 'music'): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, start);
    osc.frequency.exponentialRampToValueAtTime(45, start + 0.12);
    g.gain.setValueAtTime(0.28, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    osc.connect(g).connect(this.groups[group]!);
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

  /** Einen Sechzehntel-Schritt eines Stücks zum Zeitpunkt t in die Gruppe group einplanen */
  private renderStep(e: SongStep, t: number, step: number, group: Group, leadType: OscillatorType): void {
    const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
    const leadDur = e.hold ? 14 : e.leadLen ? e.leadLen * 0.95 : 1.8;
    if (e.lead) this.tone(group, midi(e.lead), t, step * leadDur, leadType, 0.05);
    if (e.arp) this.tone(group, midi(e.arp), t, step * 0.9, 'square', 0.03);
    if (e.bass) this.tone(group, midi(e.bass.note), t, step * e.bass.steps, 'triangle', 0.12);
    if (e.pad) for (const n of e.pad) this.tone(group, midi(n), t, step * 15.5, 'triangle', 0.035);
    if (e.guitar && group === 'music')
      this.guitar(e.guitar.notes, midi, t, step * e.guitar.steps, e.guitar.mute);
    if (e.solo && group === 'music')
      this.soloNote(midi(e.solo.note), t, step * e.solo.steps * 0.95, e.solo.bend);
    if (e.crash) this.noise(group, t, 0.6, 0.05);
    if (e.kick) this.kick(t, group);
    if (e.snare) this.noise(group, t, 0.09, 0.07);
    if (e.hat) this.noise(group, t, 0.02, 0.03);
    if (e.openHat) this.noise(group, t, 0.07, 0.025);
    if (e.riser) this.noise(group, t, 0.05, 0.02 + e.riser * 0.1);
  }

  /**
   * Stück mit 50-ms-Vorausplanung abspielen. Endliche Stücke (steps) rufen nach dem Ausklingen onEnd auf.
   * Rückgabe: Stopp-Funktion.
   */
  private runTrack(track: MusicTrack, group: Group, onEnd?: () => void): () => void {
    const ctx = this.ctx!;
    const step = 60 / track.bpm / 4;
    const leadType = track.lead ?? 'square';
    let pos = 0;
    let next = ctx.currentTime + 0.05;
    let stopped = false;
    const stop = () => {
      stopped = true;
      window.clearInterval(timer);
    };
    const schedule = () => {
      const c = this.ready();
      if (!c || stopped) return;
      // nach einer Unterbrechung nicht hinterherhetzen
      if (next < c.currentTime - 0.25) next = c.currentTime + 0.05;
      while (next < c.currentTime + 0.2) {
        if (track.steps !== undefined && pos >= track.steps) {
          // letzte Töne ausklingen lassen, dann weiter
          if (c.currentTime > next + 1.2) {
            stop();
            onEnd?.();
          }
          return;
        }
        this.renderStep(track.at(pos), next, step, group, leadType);
        next += step;
        pos++;
      }
    };
    const timer = window.setInterval(schedule, 50);
    schedule();
    return stop;
  }

  /** Eigene, SID-inspirierte Komposition für die INTRUDER-Demo (siehe demoSong.ts), Wiederholung nach 88 Takten. */
  startMusic(track: MusicTrack = DEMO_TRACK): void {
    this.musicWant = track;
    if (!this.ready()) return;
    if (this.stopTrack) {
      if (this.track === track) return;
      this.stopMusic();
    }
    this.track = track;
    this.stopTrack = this.runTrack(track, 'music');
  }

  /** keep: dieses Stück weiterlaufen lassen (Titelmusik, wenn der Spielzustand nur „keine Spielmusik“ meldet) */
  stopMusic(keep?: MusicTrack): void {
    if (keep && this.musicWant === keep) return;
    this.musicWant = null;
    this.haltMusic();
  }

  private haltMusic(): void {
    this.stopTrack?.();
    this.stopTrack = null;
    this.track = null;
  }
}

export const audio = new AudioEngine();
