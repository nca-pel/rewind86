/**
 * Easter-Egg: LOAD"ABANDON",8,1 lädt – auch ohne Diskette – ein Video, das im Monitor läuft.
 * Der C64-Bildschirm bleibt schwarz; die Oberfläche legt das Video (YouTube-Einbettung) in die Bildröhre,
 * darüber die Röhreneffekte. Jede Taste (RUN/STOP, RETURN, Leertaste) beendet es.
 */
import type { AppState } from '../../engine/types';
import type { AppDef } from './types';

/** YouTube-Video-ID des Easter-Eggs (https://www.youtube.com/watch?v=rAyT1LDpyaE) */
export const ABANDON_VIDEO_ID = 'rAyT1LDpyaE';
export const ABANDON_FILE = 'ABANDON';

export interface AbandonState extends AppState {
  id: 'abandon';
}

export const abandonApp: AppDef<AbandonState> = {
  id: 'abandon',
  tickMs: null,
  start(ctx) {
    if (!ctx.state.flags.abandonSeen) {
      ctx.state.flags.abandonSeen = true;
      ctx.say('Die 1541 bleibt still – und trotzdem flackert etwas über den Bildschirm. Seltsam.', 'thought');
    }
    ctx.say('(Easter-Egg. RUN/STOP oder RETURN beendet das Video.)', 'system');
    return { id: 'abandon' };
  },
  inputMode: () => 'keys',
  key(_ctx, _app, key) {
    if (key === 'RUNSTOP' || key === 'RETURN' || key === 'SPACE') return { exit: true };
    return {};
  },
  render() {
    return { lines: [], border: 0, background: 0, text: 1, youtube: ABANDON_VIDEO_ID };
  },
};
