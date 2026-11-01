/**
 * Ablaufplan des hörbaren Radios: was je Sender nacheinander gespielt bzw. gesprochen wird. Rein und ohne Audio,
 * damit sich Längen und Reihenfolge testen lassen. Die AudioEngine spielt die Liste ab und holt sie nach dem
 * letzten Eintrag neu (Nachrichten passen sich so der Spielzeit an).
 */
import { BFBS_SHOW, NEWS_PAUSE_S, newsBulletin } from '../content/radio';
import { BFBS_SONGS, POP_SONGS, type PopTrack } from './popSongs';

export type RadioStation = 'pop' | 'info' | 'bfbs';

export type RadioItem =
  | { kind: 'song'; track: PopTrack }
  | { kind: 'speech'; text: string; lang: 'de-DE' | 'en-GB' }
  | { kind: 'pause'; seconds: number };

/** Geschätzte Sprechdauer (Sekunden) – für Tests und als Ersatz, wenn der Browser keine Sprachausgabe hat */
export function speechSeconds(text: string): number {
  return 1 + text.length / 14;
}

export function radioPlaylist(station: RadioStation, clock: string): RadioItem[] {
  switch (station) {
    case 'pop':
      return POP_SONGS.map((track) => ({ kind: 'song', track }));
    case 'info':
      return [
        ...newsBulletin(clock).map((text): RadioItem => ({ kind: 'speech', text, lang: 'de-DE' })),
        { kind: 'pause', seconds: NEWS_PAUSE_S },
      ];
    case 'bfbs':
      return BFBS_SHOW.flatMap((s): RadioItem[] => [
        { kind: 'speech', text: s.intro, lang: 'en-GB' },
        { kind: 'song', track: BFBS_SONGS[s.song] },
      ]);
  }
}

export function playlistSeconds(items: RadioItem[]): number {
  return items.reduce(
    (n, it) =>
      n + (it.kind === 'song' ? it.track.seconds : it.kind === 'pause' ? it.seconds : speechSeconds(it.text)),
    0,
  );
}
