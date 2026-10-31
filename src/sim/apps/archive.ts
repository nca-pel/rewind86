/** Jans selbst geschriebenes Archivprogramm (GDD §11.3). Daten liegen im geteilten Spielzustand. */
import { ARCHIVE_SECTIONS } from '../../content/archive';
import type { AppState, ArchiveEntry } from '../../engine/types';
import { toPetsciiText } from '../screen';
import type { AppDef } from './types';

type View = 'menu' | 'list' | 'search' | 'results' | 'newSection' | 'newTitle' | 'newText' | 'saved';

export interface ArchiveState extends AppState {
  id: 'archive';
  view: View;
  section: ArchiveEntry['section'] | null;
  query: string;
  draftTitle: string;
}

export const archiveApp: AppDef<ArchiveState> = {
  id: 'archive',
  tickMs: null,
  start(ctx) {
    if (!ctx.state.flags.archiveOpened) {
      ctx.say(
        'Dein Archivprogramm. Selbst geschrieben, zwei Wochenenden Arbeit – und du bist immer noch stolz darauf.',
        'thought',
      );
      ctx.state.flags.archiveOpened = true;
    }
    return { id: 'archive', view: 'menu', section: null, query: '', draftTitle: '' };
  },
  inputMode: (app) => (['search', 'newTitle', 'newText'].includes(app.view) ? 'line' : 'keys'),
  key(_ctx, app, key) {
    const k = key.toUpperCase();
    if (app.view === 'menu') {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= 5) {
        app.section = ARCHIVE_SECTIONS[n - 1].key;
        app.view = 'list';
      } else if (k === '6') app.view = 'search';
      else if (k === '7') app.view = 'newSection';
      else if (k === '0' || k === 'RUNSTOP') return { exit: true };
      return {};
    }
    if (app.view === 'newSection') {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= 5) {
        app.section = ARCHIVE_SECTIONS[n - 1].key;
        app.view = 'newTitle';
      } else if (k === 'RUNSTOP') app.view = 'menu';
      return {};
    }
    if (k === 'RUNSTOP' || app.view === 'list' || app.view === 'results' || app.view === 'saved')
      app.view = 'menu';
    return {};
  },
  line(ctx, app, text) {
    const t = toPetsciiText(text.trim()).slice(0, 120);
    if (app.view === 'search') {
      app.query = t;
      app.view = 'results';
    } else if (app.view === 'newTitle') {
      if (!t) {
        app.view = 'menu';
        return {};
      }
      app.draftTitle = t.slice(0, 16);
      app.view = 'newText';
    } else if (app.view === 'newText') {
      const id = `a${ctx.state.archive.length + 1}_${ctx.state.commandCount}`;
      ctx.state.archive.push({ id, section: app.section ?? 'notizen', title: app.draftTitle, text: t });
      ctx.say('Die 1541 rattert kurz: Eintrag gespeichert.', 'caption');
      ctx.cue('drive');
      app.view = 'saved';
      return { minutes: 1 };
    }
    return {};
  },
  render(state, app) {
    const L: string[] = ['JANS ARCHIV V1.3', '----------------------------------------'];
    const colors: Record<number, number> = { 0: 7 };
    const entries = (list: ArchiveEntry[]) => {
      if (list.length === 0) L.push('(KEINE EINTRAEGE)');
      for (const e of list) L.push(`${e.title}: ${e.text}`);
    };
    switch (app.view) {
      case 'menu':
        ARCHIVE_SECTIONS.forEach((s, i) => L.push(` ${i + 1}  ${s.label}`));
        L.push(' 6  SUCHEN', ' 7  NEUER EINTRAG', ' 0  ENDE', '', `${state.archive.length} EINTRAEGE`);
        break;
      case 'list':
        L.push(ARCHIVE_SECTIONS.find((s) => s.key === app.section)?.label ?? '', '');
        entries(state.archive.filter((e) => e.section === app.section));
        L.push('', 'TASTE = MENUE');
        break;
      case 'search':
        L.push('SUCHBEGRIFF EINGEBEN + RETURN:');
        break;
      case 'results':
        L.push(`SUCHE: ${app.query}`, '');
        entries(state.archive.filter((e) => `${e.title} ${e.text}`.includes(app.query)));
        L.push('', 'TASTE = MENUE');
        break;
      case 'newSection':
        L.push('RUBRIK WAEHLEN (1-5):');
        ARCHIVE_SECTIONS.forEach((s, i) => L.push(` ${i + 1}  ${s.label}`));
        break;
      case 'newTitle':
        L.push('TITEL (MAX. 16 ZEICHEN) + RETURN:');
        break;
      case 'newText':
        L.push(`TITEL: ${app.draftTitle}`, 'TEXT + RETURN:');
        break;
      case 'saved':
        L.push('GESPEICHERT.', '', 'TASTE = MENUE');
        break;
    }
    return {
      lines: L.flatMap((l) => (l.length > 40 ? l.match(/.{1,40}/g)! : [l])),
      border: 11,
      background: 12,
      text: 0,
      lineColors: colors,
      cursor: true,
    };
  },
};
