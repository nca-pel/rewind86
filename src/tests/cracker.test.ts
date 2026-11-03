import { GAME_CONFIG } from '../content/config';
import { CRACKER_EFFECTS, FLUXHQ, INTENTS, STARDUST } from '../content/cracker';
import { Session } from './helpers';

const SD = GAME_CONFIG.mailboxes.stardust;
const FX = GAME_CONFIG.mailboxes.fluxhq;
const dev = (s: Session, text: string) => s.do({ type: 'dev', text });

function terminalReady(at = '20:00'): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('lege auf');
  s.a('warte');
  s.a('öffne schublade');
  s.a('nimm archivdiskette');
  s.a('lege archivdiskette ins laufwerk');
  s.a('schalte computer ein');
  dev(s, `zeit ${at}`);
  s.c('LOAD"TERMINAL",8');
  s.c('RUN');
  return s;
}

function connect(s: Session, number: string): void {
  s.a(`wähle ${number}`);
  s.a('lege hörer in den koppler');
  s.key('RETURN');
}

function chatReady(): Session {
  const s = terminalReady();
  connect(s, SD.phoneNumber);
  s.c('GAST');
  s.key('6');
  expect(s.screen()).toContain('CHAT MIT RASTAR  (RUN/STOP');
  return s;
}

describe('Cracker-Mailboxen', () => {
  test('FLUX-HQ: Nummer steht im BIT-SCHUPPEN, News lesbar, STARDUST-Nummer bei den News', () => {
    const s = terminalReady('19:00');
    connect(s, GAME_CONFIG.mailboxes.bitschuppen.phoneNumber);
    s.c('GAST');
    s.key('1');
    s.key('2');
    expect(s.screen()).toContain('DEMOS BEI FLUX');
    s.key('2');
    expect(s.screen()).toContain(FX.phoneNumber);
    expect(s.has('bbs_fluxhq')).toBe(true);
  });

  test('FLUX-HQ: News als Gast, Download erst nach Freischaltung', () => {
    const s = terminalReady('20:00');
    s.state.flags.test = true;
    connect(s, FX.phoneNumber);
    s.c('GAST');
    s.key('1');
    s.key('1');
    expect(s.screen()).toContain('WILLKOMMEN BEI FLUX');
    s.key('4');
    expect(s.screen()).toContain('STARDUST BBS');
    expect(s.has('bbs_stardust')).toBe(true);
  });
});

describe('Chat mit RASTAR', () => {
  test('Begrüßung, Gedächtnis und Themenwechsel', () => {
    const s = chatReady();
    expect(s.screen()).toContain('RASTAR>');
    s.c('wer bist du eigentlich?');
    expect(s.screen()).toMatch(/RICO/);
    s.c('wie alt bist du');
    expect(s.screen()).toMatch(/LEHRE/);
    expect(s.state.flags.crk_n_who).toBe(1);
    expect(s.has('rastar_met')).toBe(true);
  });

  test('Wiederholte Fragen bekommen andere Antworten', () => {
    const s = chatReady();
    s.c('erzähl was über musik');
    const a = s.screen();
    s.c('und noch mal musik bitte');
    const b = s.screen();
    expect(b).not.toEqual(a);
    expect(b).toMatch(/TEXI|HUBBARD/);
  });

  test('Unbekanntes bekommt trotzdem eine Antwort (Echo, Ausweichen)', () => {
    const s = chatReady();
    s.c('ich mag pizza');
    expect(s.screen()).toContain('PIZZA');
    s.c('xyzzy plugh');
    expect(s.screen().match(/RASTAR>/g)!.length).toBeGreaterThanOrEqual(3);
  });

  test('Agentenstrang: RASTAR weiß von nichts', () => {
    const s = chatReady();
    s.c('kennst du seidel?');
    expect(s.screen()).toMatch(/KEINE AHNUNG|NICHT MEINE ABTEILUNG/);
    expect(s.state.flags.seidelSuspicion ?? 0).toBe(0);
  });

  test('Beleidigungen beenden den Chat, Verabschiedung auch', () => {
    const s = chatReady();
    s.c('du bist dumm');
    s.c('du bist dumm');
    s.c('du bist dumm');
    expect(s.screen()).toContain('CHAT BEENDET');
    s.key('6');
    s.c('tschüss');
    expect(s.screen()).toContain('CHAT BEENDET');
  });

  test('Jeder Effekt wird mit Listing diktiert', () => {
    const s = chatReady();
    s.c('zeig mir einen farbbalken');
    expect(s.screen()).toContain('53280');
    expect(s.has('fx_balken')).toBe(true);
    s.c('und die farbwelle?');
    expect(s.screen()).toContain('55296');
    s.c('sinus scroller');
    expect(s.screen()).toContain('SIN(X/4+T/3)');
  });

  test('Chat kostet Spielzeit', () => {
    const s = chatReady();
    const t = s.state.gameClock;
    s.c('hallo');
    expect(s.state.gameClock).not.toEqual(t);
  });

  test('Alle Stichwort-Absichten haben Antworten', () => {
    for (const i of INTENTS) expect(i.replies.length).toBeGreaterThan(0);
    for (const fx of CRACKER_EFFECTS) for (const l of fx.listing) expect(l.length).toBeLessThanOrEqual(38);
  });
});

describe('Effekte laufen wirklich animiert auf dem C64', () => {
  function type(fx: (typeof CRACKER_EFFECTS)[number]): Session {
    const s = new Session();
    s.a('schalte computer ein');
    for (const l of fx.listing) s.c(l);
    s.c('RUN');
    return s;
  }

  test.each(CRACKER_EFFECTS.map((e) => [e.id, e] as const))('%s zeigt unterschiedliche Bilder', (_id, fx) => {
    const s = type(fx);
    expect(s.state.computer.run?.running).toBe(true);
    const frames = new Set<string>();
    for (let i = 0; i < 16; i++) {
      s.do({ type: 'c64tick' });
      const v = s.state.computer.screen;
      frames.add(`${v.border}|${v.background}|${s.screen()}|${v.colors.slice(0, 80).join()}`);
    }
    expect(frames.size).toBeGreaterThan(4);
    s.key('RUNSTOP');
    expect(s.state.computer.run?.running).toBeUndefined();
    expect(s.screen()).toContain('READY.');
  });
});

describe('Box-Downloads sind lauffähig', () => {
  test.each([...FLUXHQ.downloads, ...STARDUST.downloads].map((d) => [d.name, d] as const))(
    '%s läuft ohne Fehler und animiert',
    (_n, d) => {
      const s = new Session();
      s.a('schalte computer ein');
      for (const l of d.basic) s.c(l);
      s.c('RUN');
      const frames = new Set<string>();
      for (let i = 0; i < 12; i++) {
        s.do({ type: 'c64tick' });
        const v = s.state.computer.screen;
        frames.add(`${v.border}|${v.chars.join()}|${v.colors.join()}`);
      }
      expect(s.screen()).not.toMatch(/ERROR/);
      expect(s.state.computer.run?.running).toBe(true);
      expect(frames.size).toBeGreaterThan(3);
    },
  );
});
