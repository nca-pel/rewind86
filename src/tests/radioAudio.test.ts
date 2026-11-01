import { describe, expect, it } from 'vitest';
import { RING_ON_S, renderBell } from '../audio/bell';
import { BFBS_SONGS, POP_SONGS } from '../audio/popSongs';
import { playlistSeconds, radioPlaylist } from '../audio/radioProgram';
import { BFBS_SHOW, MAX_NEWS, newsBulletin } from '../content/radio';

const rms = (a: Float32Array, from: number, to: number) => {
  let s = 0;
  for (let i = from; i < to; i++) s += a[i] * a[i];
  return Math.sqrt(s / (to - from));
};

describe('Telefonklingel', () => {
  it('klingelt eine Sekunde und klingt danach aus', () => {
    const sr = 22050;
    const b = renderBell(sr);
    expect(b.length).toBe(Math.floor(sr * (RING_ON_S + 0.8)));
    const ringing = rms(b, Math.floor(sr * 0.3), Math.floor(sr * 0.9));
    const tail = rms(b, Math.floor(sr * 1.6), b.length);
    expect(ringing).toBeGreaterThan(0.1);
    expect(tail).toBeLessThan(ringing / 4);
    expect(Math.abs(b[b.length - 1])).toBeLessThan(1e-3);
    expect(Math.max(...b.map(Math.abs))).toBeLessThanOrEqual(0.9001);
  });

  it('ist deterministisch', () => {
    expect(renderBell(8000)).toEqual(renderBell(8000));
  });
});

describe('Radio-Songs', () => {
  it('Popwelle: fünf eigene Songs, zusammen etwa zehn Minuten', () => {
    expect(POP_SONGS).toHaveLength(5);
    const s = playlistSeconds(radioPlaylist('pop', '1986-11-14T18:00'));
    expect(s).toBeGreaterThan(540);
    expect(s).toBeLessThan(690);
  });

  it('BFBS: vier Ansagen mit je einem Song, zusammen etwa zehn Minuten', () => {
    const items = radioPlaylist('bfbs', '1986-11-14T18:00');
    expect(items.map((i) => i.kind)).toEqual([
      'speech',
      'song',
      'speech',
      'song',
      'speech',
      'song',
      'speech',
      'song',
    ]);
    expect(
      items.filter((i) => i.kind === 'speech').every((i) => i.kind === 'speech' && i.lang === 'en-GB'),
    ).toBe(true);
    BFBS_SHOW.forEach((s) => expect(s.intro).toContain(BFBS_SONGS[s.song].title));
    const sec = playlistSeconds(items);
    expect(sec).toBeGreaterThan(510);
    expect(sec).toBeLessThan(690);
  });

  it('Songs haben eine Melodie mit Tonlängen und enden mit einem Schlussakkord', () => {
    for (const t of [...POP_SONGS, ...BFBS_SONGS]) {
      const leads = Array.from({ length: t.steps }, (_, i) => t.at(i)).filter((e) => e.lead);
      expect(leads.length).toBeGreaterThan(100);
      expect(leads.slice(0, -1).every((e) => (e.leadLen ?? 0) >= 1)).toBe(true);
      expect(t.at(t.steps - 16).hold).toBe(true);
    }
  });
});

describe('Infowelle', () => {
  it('höchstens zehn Meldungen, dann eine Minute Pause', () => {
    for (const clock of ['1986-11-14T18:00', '1986-11-17T22:00', '1986-11-21T12:00']) {
      const b = newsBulletin(clock);
      expect(b.length - 2).toBeLessThanOrEqual(MAX_NEWS);
      const items = radioPlaylist('info', clock);
      expect(items[items.length - 1]).toEqual({ kind: 'pause', seconds: 60 });
      expect(items.slice(0, -1).every((i) => i.kind === 'speech' && i.lang === 'de-DE')).toBe(true);
    }
  });

  it('meldet Ereignisse erst, wenn sie passiert sind', () => {
    expect(newsBulletin('1986-11-17T20:00').join(' ')).not.toContain('Besse');
    expect(newsBulletin('1986-11-17T21:00').join(' ')).toContain('Besse');
    expect(newsBulletin('1986-11-14T18:00').join(' ')).not.toContain('Verheugen');
    expect(newsBulletin('1986-11-14T18:00').join(' ')).toContain('Reagan');
  });

  it('Feiertage nur am jeweiligen Tag', () => {
    expect(newsBulletin('1986-11-16T10:00').join(' ')).toContain('Volkstrauertag');
    expect(newsBulletin('1986-11-17T10:00').join(' ')).not.toContain('Volkstrauertag');
    expect(newsBulletin('1986-11-19T10:00').join(' ')).toContain('Buß- und Bettag');
  });
});
