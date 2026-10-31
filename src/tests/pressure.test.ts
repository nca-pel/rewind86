import { GAME_CONFIG } from '../content/config';
import { EVENTS } from '../content/events';
import { ENDING_BY_ID } from '../content/endings';
import { MAILBOXES } from '../content/networks';
import { evalCondition } from '../engine/conditions';
import { Ctx } from '../engine/context';
import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { changeRelationship, stageOf, threshold } from '../engine/pressure';
import { createSaveFile, parseSave } from '../engine/save';
import { createInitialState } from '../engine/state';
import type { Condition } from '../engine/types';
import { Session } from './helpers';

const NUMBER = GAME_CONFIG.secretNetwork.phoneNumber;
const T = GAME_CONFIG.thresholds.seidelSuspicion;

/** Milestone »online«, abgemeldet, Hörer aufgelegt, nach dem Telefonat des Vaters */
function offlineInModule(): Session {
  const s = new Session(false);
  s.state = milestoneState('online', step)!;
  s.key('4');
  s.a('nimm hörer');
  s.a('lege auf');
  s.do({ type: 'dev', text: 'zeit 19:00' });
  return s;
}

function suspicion(s: Session): number {
  return s.state.relationships.seidelSuspicion;
}

function setSuspicion(s: Session, v: number): void {
  s.do({ type: 'dev', text: `bez seidelSuspicion ${v}` });
}

/** Mit dem Modul anmelden (Modulmenü muss sichtbar sein) */
function login(s: Session): string {
  s.key('1');
  s.a(`wähle ${NUMBER}`);
  s.a('lege hörer in den koppler');
  return s.key('RETURN');
}

function logoffAndHangUp(s: Session): void {
  if (s.state.telecom.connectedSystemId) s.key('4');
  s.a('nimm hörer');
  s.a('lege auf');
}

describe('Benannte Schwellen (GDD §10.4)', () => {
  test('Bedingungen über Schwellennamen', () => {
    const st = createInitialState();
    st.relationships.seidelSuspicion = T.noticeable;
    expect(evalCondition(st, { rel: 'seidelSuspicion', atLeast: 'noticeable' })).toBe(true);
    expect(evalCondition(st, { rel: 'seidelSuspicion', atLeast: 'dangerous' })).toBe(false);
    expect(evalCondition(st, { rel: 'seidelSuspicion', below: 'dangerous' })).toBe(true);
    expect(evalCondition(st, { rel: 'ralfTrust', below: 'trusting' })).toBe(false);
    expect(evalCondition(st, { rel: 'seidelSuspicion', atLeast: 'gibtsnicht' })).toBe(false);
    expect(stageOf(st, 'seidelSuspicion')).toBe('noticeable');
  });

  test('Alle Schwellennamen in Storydaten existieren', () => {
    const conds: Condition[] = [];
    const collect = (c: Condition | undefined): void => {
      if (!c) return;
      conds.push(c);
      if ('all' in c) c.all.forEach(collect);
      if ('any' in c) c.any.forEach(collect);
      if ('not' in c) collect(c.not);
    };
    for (const ev of EVENTS) {
      collect(ev.trigger);
      ev.variants.forEach((v) => collect(v.when));
    }
    for (const sys of Object.values(MAILBOXES))
      for (const b of sys.boards) b.messages.forEach((m) => collect(m.when));
    const named = conds.flatMap((c) =>
      'atLeast' in c ? [[c.rel, c.atLeast]] : 'below' in c ? [[c.rel, c.below]] : [],
    ) as Array<[keyof typeof GAME_CONFIG.thresholds, string]>;
    expect(named.length).toBeGreaterThanOrEqual(5);
    for (const [rel, name] of named) expect(threshold(rel, name), `${rel}.${name}`).toBeDefined();
    for (const ev of EVENTS)
      for (const v of ev.variants)
        for (const e of v.effects)
          if (e.type === 'gameOver') expect(ENDING_BY_ID[e.ending], e.ending).toBeDefined();
  });

  test('Ohne Warnung bleibt der Verdacht unter der Entdeckungsschwelle', () => {
    const ctx = new Ctx(createInitialState());
    changeRelationship(ctx, 'seidelSuspicion', 500);
    expect(ctx.state.relationships.seidelSuspicion).toBe(T.discovered - 1);
    ctx.state.flags.seidelFinalWarning = true;
    changeRelationship(ctx, 'seidelSuspicion', 5);
    expect(ctx.state.relationships.seidelSuspicion).toBe(100);
    expect(ctx.state.debugLog.some((l) => l.includes('seidelSuspicion'))).toBe(true);
  });
});

describe('Seidels Verdacht im Spiel (Ausbauplan Punkt 4)', () => {
  test('Der normale Lösungsweg bleibt unauffällig', () => {
    const s = new Session(false);
    s.state = milestoneState('end', step)!;
    expect(s.state.flags.sliceEnded).toBe(true);
    expect(suspicion(s)).toBeGreaterThan(0);
    expect(suspicion(s)).toBeLessThan(T.noticeable);
    expect(s.state.firedEvents.filter((e) => e.startsWith('ev_susp'))).toEqual([]);
  });

  test('Anmeldung, Online-Zeit und Sendeversuch erhöhen den Verdacht', () => {
    const s = offlineInModule();
    const v0 = suspicion(s);
    login(s);
    expect(suspicion(s)).toBe(v0 + GAME_CONFIG.risk.secretLogin);
    s.key('2');
    s.key('2');
    expect(suspicion(s)).toBe(v0 + GAME_CONFIG.risk.secretLogin + GAME_CONFIG.risk.secretSendAttempt);
    const v1 = suspicion(s);
    s.a(`warte ${GAME_CONFIG.risk.secretOnlineMinutesPerPoint * 2}`);
    expect(suspicion(s)).toBeGreaterThanOrEqual(v1 + 2);
  });

  test('»Auffällig«: neuer Tonfall im Netz', () => {
    const s = offlineInModule();
    setSuspicion(s, T.noticeable - 1);
    login(s);
    expect(s.state.firedEvents).toContain('ev_susp_noticeable');
    expect(s.key('1')).toContain('PROTOKOLLIERUNG');
    s.key('3');
    expect(s.has('net_watch')).toBe(true);
  });

  test('»Gefährlich«: Verbindung getrennt, Kennung gesperrt, später anonymer Anruf', () => {
    const s = offlineInModule();
    setSuspicion(s, T.dangerous - 1);
    login(s);
    expect(s.state.telecom.connectedSystemId).toBeNull();
    expect(s.has('account_locked')).toBe(true);
    expect(s.screen()).toContain('NO CARRIER');

    // Während der Sperre: kein Zugang, kein weiterer Verdacht
    logoffAndHangUp(s);
    const v = suspicion(s);
    expect(login(s)).toContain('KENNUNG GESPERRT BIS');
    expect(suspicion(s)).toBe(v);
    s.a('nimm hörer');
    s.a('lege auf');

    // Der Anruf kommt, sobald die Leitung frei ist
    const out = s.a('warte 60');
    expect(out).toMatch(/Telefon .* klingelt/);
    expect(s.state.telecom.ringing).toBe('anon');
    expect(s.a('nimm hörer')).toMatch(/Aufgelegt/);
    expect(s.has('anon_call')).toBe(true);
    s.a('lege auf');

    // Nach Ablauf der Sperre geht es wieder
    s.do({ type: 'dev', text: `zeit +${GAME_CONFIG.risk.lockMinutes}` });
    expect(login(s)).toContain('ZUGANG: EINGESCHRAENKT');
  });

  test('Anonymer Anruf bei belegter Leitung wird später wiederholt; ohne Abnehmen geht die Mutter ran', () => {
    const s = offlineInModule();
    setSuspicion(s, T.dangerous);
    s.a('nimm hörer'); // Jan blockiert die Leitung
    s.a('warte 50');
    expect(s.state.telecom.ringing).toBeNull();
    expect(s.state.scheduledEvents.some((e) => e.id === 'ev_anon_call' && e.status === 'pending')).toBe(true);
    s.a('lege auf');
    s.a('warte 30');
    expect(s.state.telecom.ringing).toBe('anon');
    expect(s.a('warte 5')).toMatch(/Mutter|Aufgelegt/);
    expect(s.state.flags.anonCallDone).toBe(true);
    expect(s.state.telecom.ringing).toBeNull();
  });

  test('Letzte Warnung, danach Spielende – erst nach erkennbarer Ankündigung', () => {
    const s = offlineInModule();
    setSuspicion(s, T.critical - 2);
    expect(s.state.flags.seidelFinalWarning).toBeUndefined();
    s.do({ type: 'dev', text: `zeit +${GAME_CONFIG.risk.lockMinutes}` });
    const out = login(s);
    expect(s.state.flags.seidelFinalWarning).toBe(true);
    expect(s.log.map((l) => l.text).join('\n')).toMatch(/Warnung: Weitere riskante Zugriffe/);
    expect(s.state.flags.gameOver).toBeUndefined();
    expect(out).toContain('ZUGANG');
    expect(s.key('1')).toContain('LETZTE WARNUNG');

    // Weiter riskant: wieder anmelden, bis es vorbei ist
    for (let i = 0; i < 5 && !s.state.flags.gameOver; i++) {
      s.key('RETURN');
      logoffAndHangUp(s);
      login(s);
    }
    expect(s.state.flags.gameOver).toBe('end_discovered');
    expect(s.ui).toContainEqual({ type: 'gameOver', ending: 'end_discovered' });

    // Danach nur noch Laden/Meta-Befehle
    expect(s.a('nimm hörer')).toMatch(/Spiel ist zu Ende/);
    const clock = s.state.gameClock;
    s.key('1');
    expect(s.state.gameClock).toBe(clock);
  });

  test('Spielstände aus Schema 3 bekommen Sperren und Risiko-Minuten', () => {
    const st = createInitialState();
    const old = structuredClone(st) as unknown as Record<string, unknown>;
    const telecom = old.telecom as Record<string, unknown>;
    delete telecom.locks;
    delete telecom.riskMinutes;
    const r = parseSave(
      JSON.stringify({
        ...createSaveFile(st, 't', '2026-01-01T00:00'),
        schemaVersion: 3,
        state: { ...old, schemaVersion: 3 },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.file.state.telecom.locks).toEqual({});
      expect(r.file.state.telecom.riskMinutes).toBe(0);
    }
  });
});
