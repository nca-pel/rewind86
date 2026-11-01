import { useCallback, useEffect, useRef, useState } from 'react';
import { DEMO_TRACK, audio, type MusicTrack } from '../audio/audio';
import { FERNHANDEL_BPM, fernhandelStep } from '../audio/fernhandelSong';
import { step } from '../engine/engine';
import { createInitialState } from '../engine/state';
import type { Command, GameState, UiEffect } from '../engine/types';
import { recordMiss } from './playtestLog';
import { isSlot, readSlot, writeSlot } from './storage';

export type Panel = 'desk' | 'c64' | 'notes';

function autosave(s: GameState): void {
  if (!s.flags.gameOver) writeSlot('auto', s);
}

export interface GameUi {
  state: GameState | null;
  dispatch: (cmd: Command) => void;
  newGame: () => void;
  loadState: (s: GameState, message?: string) => void;
  toTitle: () => void;
  toast: string | null;
  showToast: (t: string) => void;
  focusRequest: { target: 'c64' | 'adventure'; n: number } | null;
  detail: string | null;
  setDetail: (id: string | null) => void;
  notebookOpen: boolean;
  setNotebookOpen: (o: boolean) => void;
  menuOpen: false | 'menu' | 'load';
  setMenuOpen: (o: false | 'menu' | 'load') => void;
  sliceEnd: boolean;
  dismissSliceEnd: () => void;
  /** Spielende rückgängig machen: Autosave (Stand vor der letzten Handlung) laden */
  undoGameOver: () => void;
  demoMusic: boolean;
}

const FERNHANDEL_TRACK: MusicTrack = { bpm: FERNHANDEL_BPM, at: fernhandelStep };

export function useGame(): GameUi {
  const [state, setState] = useState<GameState | null>(null);
  const ref = useRef<GameState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<GameUi['focusRequest']>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<false | 'menu' | 'load'>(false);
  const [sliceEnd, setSliceEnd] = useState(false);
  const [demoMusic, setDemoMusic] = useState(false);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((t: string) => {
    setToast(t);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const commit = useCallback((s: GameState | null) => {
    ref.current = s;
    setState(s);
  }, []);

  const loadState = useCallback(
    (s: GameState, message = 'Spielstand geladen.') => {
      commit(s);
      setDetail(null);
      setSliceEnd(false);
      setDemoMusic(s.computer.app?.id === 'intruder');
      showToast(message);
    },
    [commit, showToast],
  );

  const handleUi = useCallback(
    (effects: UiEffect[]) => {
      for (const e of effects) {
        switch (e.type) {
          case 'focus':
            setFocusRequest((f) => ({ target: e.target, n: (f?.n ?? 0) + 1 }));
            break;
          case 'openDetail':
            setDetail(e.id);
            break;
          case 'closeDetail':
            setDetail(null);
            break;
          case 'openNotebook':
            setNotebookOpen(true);
            break;
          case 'save': {
            if (!isSlot(e.slot) || e.slot === 'auto') {
              showToast('Speichern geht in Slot 1, 2 oder 3 (z. B. SPEICHERN 2).');
              break;
            }
            showToast(
              writeSlot(e.slot, ref.current!)
                ? `Gespeichert in Slot ${e.slot}.`
                : 'Speichern fehlgeschlagen (Browser-Speicher blockiert?).',
            );
            break;
          }
          case 'load': {
            if (!isSlot(e.slot)) {
              showToast('Laden: Slot auto, 1, 2 oder 3.');
              break;
            }
            const r = readSlot(e.slot);
            if (!r) showToast(`Slot ${e.slot} ist leer.`);
            else if (!r.ok) showToast(r.error);
            else loadState(r.file.state, `Slot ${e.slot} geladen.`);
            break;
          }
          case 'listSaves':
            setMenuOpen('load');
            break;
          case 'autosave':
            if (ref.current) autosave(ref.current);
            showToast(`Automatisch gespeichert: ${e.reason}`);
            break;
          case 'parseMiss':
            recordMiss(e, ref.current?.gameClock ?? '');
            break;
          case 'demoMusic':
            setDemoMusic(e.on);
            break;
          case 'sliceEnd':
            setSliceEnd(true);
            break;
          case 'gameOver':
            setDetail(null);
            setMenuOpen(false);
            break;
        }
      }
    },
    [loadState, showToast],
  );

  const dispatch = useCallback(
    (cmd: Command) => {
      const cur = ref.current;
      if (!cur) return;
      const r = step(cur, cmd);
      commit(r.state);
      for (const cue of r.audio) audio.play(cue);
      handleUi(r.ui);
      // Fortlaufender Autosave (Ticks verändern nur Animationszustand und werden nicht gespeichert).
      // Ein beendetes Spiel wird nie automatisch gespeichert – so bleibt der Schritt davor erhalten.
      if (cmd.type !== 'c64tick') autosave(r.state);
    },
    [commit, handleUi],
  );

  const newGame = useCallback(() => {
    const s = createInitialState();
    const r = step(s, { type: 'start' });
    commit(r.state);
    setDetail(null);
    setSliceEnd(false);
    setDemoMusic(false);
    writeSlot('auto', r.state);
  }, [commit]);

  const undoGameOver = useCallback(() => {
    const r = readSlot('auto');
    if (r?.ok && !r.file.state.flags.gameOver) loadState(r.file.state, 'Letzter Schritt zurückgenommen.');
    else showToast('Kein Spielstand vor dem Ende gefunden – bitte über das Menü laden.');
  }, [loadState, showToast]);

  const toTitle = useCallback(() => {
    if (ref.current) autosave(ref.current);
    commit(null);
    setMenuOpen(false);
    setDemoMusic(false);
  }, [commit]);

  // Musik folgt dem Zustand: INTRUDER-Demo bzw. laufendes FERNHANDEL; sonst Stille
  const app = state?.computer.powerOn ? state.computer.app : null;
  const musicTrack =
    app?.id === 'intruder'
      ? 'demo'
      : app?.id === 'wt07' && (app as unknown as { phase: string }).phase === 'play'
        ? 'fernhandel'
        : null;
  useEffect(() => {
    if (musicTrack === 'demo') audio.startMusic(DEMO_TRACK);
    else if (musicTrack === 'fernhandel') audio.startMusic(FERNHANDEL_TRACK);
    else audio.stopMusic();
  }, [musicTrack, demoMusic]);

  useEffect(() => {
    const save = () => {
      if (ref.current) autosave(ref.current);
    };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);

  return {
    state,
    dispatch,
    newGame,
    loadState,
    toTitle,
    toast,
    showToast,
    focusRequest,
    detail,
    setDetail,
    notebookOpen,
    setNotebookOpen,
    menuOpen,
    setMenuOpen,
    sliceEnd,
    dismissSliceEnd: () => setSliceEnd(false),
    undoGameOver,
    demoMusic,
  };
}
